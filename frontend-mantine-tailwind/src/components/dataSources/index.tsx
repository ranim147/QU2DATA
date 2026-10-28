import { useState } from "react";
import { useRouter } from "next/router";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Divider,
  Group,
  Modal,
  NumberInput,
  PasswordInput,
  Select,
  ScrollArea,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconApi, IconCloud, IconDatabase, IconFileExport, IconPlugConnected, IconRefresh, IconTable } from "@tabler/icons-react";
import {
  CREATE_DATA_SOURCE,
  CreateDataSourceData,
  CreateDataSourceVariables,
  EXTRACT_DATA_SOURCE,
  ExtractDataSourceData,
  ExtractDataSourceVariables,
  TEST_DATA_SOURCE_CONNECTION,
  TEST_SAVED_DATA_SOURCE,
  TestConnectionData,
  TestConnectionVariables,
  TestSavedDataSourceData,
  TestSavedDataSourceVariables,
} from "./mutation";
import {
  GET_DATA_SOURCE_RESOURCES,
  GET_DATA_SOURCES,
  GetDataSourceResourcesData,
  GetDataSourceResourcesVariables,
  GetDataSourcesData,
} from "./query";
import { DataSourceConnectionInput, DataSourceType } from "./types";
import styles from "./dataSources.module.scss";
import { setLastFileId } from "../../utils/lastFile";

interface Props {
  projectId: string;
}

interface FormState extends DataSourceConnectionInput {
  name: string;
}

const DEFAULT_FORM: FormState = {
  name: "",
  type: "POSTGRES",
  host: "localhost",
  port: 5432,
  databaseName: "",
  username: "",
  password: "",
};

const DEFAULT_PORTS: Record<DataSourceType, number> = {
  POSTGRES: 5432,
  MYSQL: 3306,
  MONGODB: 27017,
};

export default function DataSources({ projectId }: Props) {
  const router = useRouter();
  const [opened, setOpened] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [feedback, setFeedback] = useState<{ color: "red" | "green"; message: string } | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [checkedConnections, setCheckedConnections] = useState<Record<string, boolean>>({});
  const [resourcesOpened, setResourcesOpened] = useState(false);
  const [resourceSourceName, setResourceSourceName] = useState("");
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [activeDataSourceId, setActiveDataSourceId] = useState<string | null>(null);
  const [maxRows, setMaxRows] = useState(10000);
  const [extractError, setExtractError] = useState<string | null>(null);

  const sourcesQuery = useQuery<GetDataSourcesData>(GET_DATA_SOURCES);
  const [testConnection, testState] = useMutation<TestConnectionData, TestConnectionVariables>(TEST_DATA_SOURCE_CONNECTION);
  const [createDataSource, createState] = useMutation<CreateDataSourceData, CreateDataSourceVariables>(CREATE_DATA_SOURCE);
  const [testSaved, savedTestState] = useMutation<TestSavedDataSourceData, TestSavedDataSourceVariables>(TEST_SAVED_DATA_SOURCE);
  const [extractDataSource, extractState] = useMutation<ExtractDataSourceData, ExtractDataSourceVariables>(EXTRACT_DATA_SOURCE);
  const [loadResources, resourcesState] = useLazyQuery<
    GetDataSourceResourcesData,
    GetDataSourceResourcesVariables
  >(GET_DATA_SOURCE_RESOURCES, { fetchPolicy: "network-only" });

  const projectSources = (sourcesQuery.data?.dataSources ?? []).filter(
    (source) => source.projectId === projectId
  );

  const connectionInput: DataSourceConnectionInput = {
    type: form.type,
    host: form.host,
    port: form.port,
    databaseName: form.databaseName,
    username: form.username || undefined,
    password: form.password || undefined,
  };

  function changeType(type: DataSourceType) {
    setForm({ ...form, type, port: DEFAULT_PORTS[type] });
  }

  async function handleTest() {
    setFeedback(null);
    try {
      const result = await testConnection({ variables: { input: connectionInput } });
      setFeedback({
        color: result.data?.testDataSourceConnection ? "green" : "red",
        message: result.data?.testDataSourceConnection
          ? "Connexion réussie."
          : "La connexion a échoué.",
      });
    } catch (error) {
      setFeedback({ color: "red", message: error instanceof Error ? error.message : "La connexion a échoué." });
    }
  }

  async function handleSave() {
    setFeedback(null);
    if (!form.name.trim() || !form.host.trim() || !form.databaseName.trim()) {
      setFeedback({ color: "red", message: "Le nom, l’hôte et la base sont obligatoires." });
      return;
    }
    try {
      const result = await createDataSource({
        variables: {
          input: { ...connectionInput, projectId, name: form.name.trim() },
        },
      });
      await sourcesQuery.refetch();
      const created = result.data?.createDataSource;
      if (created) {
        setOpened(false);
        setForm(DEFAULT_FORM);
        await openResources(created.id, created.name);
      }
    } catch (error) {
      setFeedback({ color: "red", message: error instanceof Error ? error.message : "Impossible d’enregistrer la source." });
    }
  }

  async function openResources(dataSourceId: string, sourceName: string) {
    setActiveDataSourceId(dataSourceId);
    setResourceSourceName(sourceName);
    setSelectedResources([]);
    setExtractError(null);
    setResourcesOpened(true);
    try {
      await loadResources({ variables: { dataSourceId } });
    } catch {
      // Apollo exposes the detailed error through resourcesState.error.
    }
  }

  async function handleExtract() {
    if (!activeDataSourceId || selectedResources.length !== 1) return;
    setExtractError(null);
    try {
      const result = await extractDataSource({
        variables: {
          input: {
            dataSourceId: activeDataSourceId,
            resources: [{ resourceName: selectedResources[0] }],
            maxRows,
          },
        },
      });
      const file = result.data?.extractDataSource;
      if (!file?.id) throw new Error("Le backend n’a retourné aucun fichier.");
      setLastFileId(file.id);
      setResourcesOpened(false);
      await router.push(`/user/quality/${file.id}?autoGenerate=1`);
    } catch (error) {
      setExtractError(error instanceof Error ? error.message : "L’import CSV a échoué.");
    }
  }

  async function handleTestSaved(dataSourceId: string) {
    setTestingId(dataSourceId);
    try {
      const result = await testSaved({ variables: { dataSourceId } });
      const valid = result.data?.testSavedDataSourceConnection === true;
      setCheckedConnections((current) => ({ ...current, [dataSourceId]: valid }));
      await sourcesQuery.refetch();
    } catch {
      setCheckedConnections((current) => ({ ...current, [dataSourceId]: false }));
      await sourcesQuery.refetch();
    } finally {
      setTestingId(null);
    }
  }

  return (
    <div>
      <Stack spacing="md">
        <button type="button" className={`${styles.connectorCard} ${styles.disabledCard}`} disabled>
          <span className={`${styles.connectorIcon} ${styles.green}`}><IconCloud size={23} /></span>
          <span><strong>Google Sheets</strong><small>URL publique ou OAuth · bientôt</small></span>
        </button>

        <button type="button" className={styles.connectorCard} onClick={() => setOpened(true)}>
          <span className={`${styles.connectorIcon} ${styles.blue}`}><IconDatabase size={23} /></span>
          <span><strong>Base SQL</strong><small>PostgreSQL · MySQL · MongoDB</small></span>
        </button>

        <button type="button" className={`${styles.connectorCard} ${styles.disabledCard}`} disabled>
          <span className={`${styles.connectorIcon} ${styles.purple}`}><IconApi size={23} /></span>
          <span><strong>API REST</strong><small>JSON · Auth Bearer · bientôt</small></span>
        </button>
      </Stack>

      {projectSources.length > 0 && (
        <div className={styles.savedSources}>
          <Group position="apart" mb="sm">
            <Text size="sm" weight={700}>Sources connectées</Text>
            <Badge color="green" variant="light">{projectSources.length}</Badge>
          </Group>
          <Stack spacing="xs">
            {projectSources.map((source) => (
              <div key={source.id} className={styles.savedSource}>
                <div>
                  <Text size="sm" weight={600}>{source.name}</Text>
                  <Text size="xs" color="dimmed">{source.type} · {source.host}:{source.port}</Text>
                </div>
                <div className={styles.connectionActions}>
                  <span
                    className={`${styles.connectionStatus} ${
                      checkedConnections[source.id] === false || source.status === "ERROR"
                        ? styles.invalid
                        : source.status === "CONNECTED"
                        ? styles.valid
                        : styles.unknown
                    }`}
                  >
                    <i />
                    {checkedConnections[source.id] === false || source.status === "ERROR"
                      ? "Connexion invalide"
                      : checkedConnections[source.id] === true
                      ? "Connexion valide"
                      : source.status === "CONNECTED"
                      ? "Connectée"
                      : "Non vérifiée"}
                  </span>
                  <Button
                    compact
                    variant="subtle"
                    color="dark"
                    leftIcon={<IconRefresh size={13} />}
                    loading={testingId === source.id && savedTestState.loading}
                    onClick={() => handleTestSaved(source.id)}
                  >
                    Vérifier
                  </Button>
                  <Button
                    compact
                    variant="subtle"
                    color="blue"
                    leftIcon={<IconTable size={13} />}
                    onClick={() => openResources(source.id, source.name)}
                  >
                    Tables
                  </Button>
                </div>
              </div>
            ))}
          </Stack>
        </div>
      )}

      <Modal opened={opened} onClose={() => setOpened(false)} title="Connecter une base de données" centered radius="lg" size="lg">
        <Stack spacing="md">
          {feedback && <Alert color={feedback.color}>{feedback.message}</Alert>}
          <Select
            label="Type de base"
            value={form.type}
            data={[{ value: "POSTGRES", label: "PostgreSQL" }, { value: "MYSQL", label: "MySQL" }, { value: "MONGODB", label: "MongoDB" }]}
            onChange={(value) => value && changeType(value as DataSourceType)}
          />
          <TextInput label="Nom de la source" required placeholder="Base de production" value={form.name} onChange={(event) => setForm({ ...form, name: event.currentTarget.value })} />
          <Group grow align="flex-start">
            <TextInput label="Hôte" required value={form.host} onChange={(event) => setForm({ ...form, host: event.currentTarget.value })} />
            <NumberInput label="Port" required min={1} max={65535} value={form.port} onChange={(value) => setForm({ ...form, port: Number(value) || DEFAULT_PORTS[form.type] })} />
          </Group>
          <TextInput label="Nom de la base" required value={form.databaseName} onChange={(event) => setForm({ ...form, databaseName: event.currentTarget.value })} />
          <Group grow align="flex-start">
            <TextInput label="Utilisateur" value={form.username} onChange={(event) => setForm({ ...form, username: event.currentTarget.value })} />
            <PasswordInput label="Mot de passe" value={form.password} onChange={(event) => setForm({ ...form, password: event.currentTarget.value })} />
          </Group>
          <Group position="apart" mt="sm">
            <Button variant="outline" color="dark" leftIcon={<IconPlugConnected size={16} />} loading={testState.loading} onClick={handleTest}>Tester la connexion</Button>
            <Group spacing="sm">
              <Button variant="subtle" color="gray" onClick={() => setOpened(false)}>Annuler</Button>
              <Button color="brand" loading={createState.loading} onClick={handleSave}>Tester et enregistrer</Button>
            </Group>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={resourcesOpened}
        onClose={() => setResourcesOpened(false)}
        title={`Tables de ${resourceSourceName}`}
        centered
        radius="lg"
        size="lg"
      >
        <Stack spacing="md">
          <Text size="sm" color="dimmed">
            Sélectionnez les tables ou collections que vous souhaitez utiliser.
          </Text>
          <Divider />
          {resourcesState.loading && (
            <Text size="sm" color="dimmed">Chargement des tables...</Text>
          )}
          {resourcesState.error && (
            <Alert color="red">{resourcesState.error.message}</Alert>
          )}
          {extractError && <Alert color="red">{extractError}</Alert>}
          {!resourcesState.loading && !resourcesState.error &&
            (resourcesState.data?.dataSourceResourcesById.length ?? 0) === 0 && (
              <Alert color="yellow">Aucune table ou collection trouvée.</Alert>
            )}
          <ScrollArea h={Math.min(360, (resourcesState.data?.dataSourceResourcesById.length ?? 0) * 52)}>
            <Stack spacing="xs">
              {(resourcesState.data?.dataSourceResourcesById ?? []).map((resource) => (
                <label key={resource} className={styles.resourceRow}>
                  <Group spacing="sm">
                    <span className={styles.resourceIcon}><IconTable size={17} /></span>
                    <Text size="sm" weight={600}>{resource}</Text>
                  </Group>
                  <Checkbox
                    checked={selectedResources.includes(resource)}
                    onChange={(event) =>
                      setSelectedResources(event.currentTarget.checked ? [resource] : [])
                    }
                  />
                </label>
              ))}
            </Stack>
          </ScrollArea>
          <Group position="apart">
            <div>
              <Text size="xs" color="dimmed">{selectedResources.length} table sélectionnée</Text>
              {selectedResources[0] && <Text size="xs" weight={600}>{selectedResources[0]}</Text>}
            </div>
            <Group spacing="sm" align="flex-end">
              <NumberInput
                label="Lignes maximum"
                hideControls
                min={1}
                max={100000}
                value={maxRows}
                onChange={(value) => setMaxRows(Math.min(Math.max(Number(value) || 1, 1), 100000))}
                styles={{ root: { width: 130 }, label: { fontSize: 11 } }}
              />
              <Button variant="subtle" color="gray" onClick={() => setResourcesOpened(false)}>Fermer</Button>
              <Button
                color="brand"
                leftIcon={<IconFileExport size={16} />}
                disabled={selectedResources.length !== 1}
                loading={extractState.loading}
                onClick={handleExtract}
              >
                Importer en CSV
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
