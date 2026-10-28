import {
  Alert,
  Badge,
  Group,
  Loader,
  MultiSelect,
  Select,
  SimpleGrid,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useQuery } from "@apollo/client";
import { useEffect, useMemo, useState } from "react";
import ConfirmComponent from "../../../layout/confirmComponent";
import { AppButton, Card } from "../../../ui";
import {
  DeduplicationKeep,
  DeduplicationParameters,
  DeduplicationRecommendationItem,
  DeduplicationRecommendationsResponse,
  DeduplicationResult,
  DuplicateAnalysis,
} from "../types";
import { GET_DEDUPLICATION_RECOMMENDATIONS } from "../query";

const HIGH_DUPLICATE_RATE = 30;

interface Props {
  fileId: string;
  columns: string[];
  action: "analyze" | "deduplicate" | null;
  analysis: DuplicateAnalysis | null;
  result: DeduplicationResult | null;
  onAnalyze: (parameters: DeduplicationParameters) => Promise<void>;
  onExecute: (parameters: DeduplicationParameters) => Promise<void>;
  onParametersChange: () => void;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <Text size="xs" color="dimmed">
        {label}
      </Text>
      <Text weight={700} size="lg" mt={2}>
        {value}
      </Text>
    </div>
  );
}

interface RecommendationGroupProps {
  title: string;
  items: DeduplicationRecommendationItem[];
  tone: "recommended" | "warning" | "info";
  onSelect?: (column: string) => void;
  availableColumns: string[];
}

function RecommendationGroup({
  title,
  items,
  tone,
  onSelect,
  availableColumns,
}: RecommendationGroupProps) {
  if (items.length === 0) return null;

  const color = tone === "recommended" ? "green" : tone === "warning" ? "orange" : "blue";
  return (
    <div>
      <Text weight={600} size="sm" mb="xs">
        {title}
      </Text>
      <div className="space-y-2">
        {items.map((item) => {
          const selectable = Boolean(onSelect && availableColumns.includes(item.column));
          const content = (
            <div className={`rounded-lg border p-3 ${tone === "warning" ? "border-orange-200 bg-orange-50" : "border-gray-200 bg-white"}`}>
              <Group position="apart" spacing="xs" noWrap>
                <Text weight={600} size="sm">
                  {item.column}
                </Text>
                <Badge color={color} variant="light">
                  {item.duplicateRate}%
                </Badge>
              </Group>
              <Text size="xs" color="dimmed" mt={4}>
                {item.reason}
              </Text>
              {selectable && (
                <Text size="xs" color="green" mt={4}>
                  Cliquer pour ajouter à la clé
                </Text>
              )}
            </div>
          );

          return selectable ? (
            <UnstyledButton
              key={item.column}
              className="block w-full text-left"
              onClick={() => onSelect?.(item.column)}
            >
              {content}
            </UnstyledButton>
          ) : (
            <div key={item.column}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}

export default function DeduplicationPanel({
  fileId,
  columns,
  action,
  analysis,
  result,
  onAnalyze,
  onExecute,
  onParametersChange,
}: Props) {
  const [subset, setSubset] = useState<string[]>([]);
  const [keep, setKeep] = useState<DeduplicationKeep>("first");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmationOpened, setConfirmationOpened] = useState(false);
  const recommendationsQuery = useQuery<DeduplicationRecommendationsResponse>(
    GET_DEDUPLICATION_RECOMMENDATIONS,
    {
      variables: { fileId },
      skip: !fileId,
      fetchPolicy: "network-only",
      notifyOnNetworkStatusChange: true,
    }
  );

  useEffect(() => {
    setSubset([]);
    setKeep("first");
    setValidationError(null);
    setConfirmationOpened(false);
  }, [fileId]);

  useEffect(() => {
    setSubset((selected) => selected.filter((column) => columns.includes(column)));
  }, [columns]);

  const parameters = useMemo<DeduplicationParameters>(
    () => ({ subset, keep, preview: true }),
    [keep, subset]
  );
  const busy = action === "analyze" || action === "deduplicate";
  const canExecute = Boolean(analysis && analysis.duplicateCount > 0 && subset.length > 0);
  const recommendationResponse =
    recommendationsQuery.data?.getDeduplicationRecommendations;
  const recommendations = !recommendationsQuery.loading && recommendationResponse?.success
    ? recommendationResponse.data
    : null;
  const recommendationError = recommendationsQuery.loading
    ? null
    : recommendationsQuery.error?.message ||
      (recommendationResponse && !recommendationResponse.success
        ? recommendationResponse.message
        : null);
  const recommendationsEmpty = Boolean(
    recommendations &&
      recommendations.recommended.length === 0 &&
      recommendations.notAdvised.length === 0 &&
      recommendations.lowDuplicate.length === 0
  );

  const updateSubset = (value: string[]) => {
    setSubset(Array.from(new Set(value)));
    setValidationError(null);
    onParametersChange();
  };

  const analyze = async () => {
    if (subset.length === 0) {
      setValidationError("Sélectionnez au moins une colonne pour définir la clé.");
      return;
    }
    setValidationError(null);
    await onAnalyze(parameters);
  };

  const addRecommendedColumn = (column: string) => {
    if (!columns.includes(column) || subset.includes(column)) return;
    setSubset((selected) => [...selected, column]);
    setValidationError(null);
    onParametersChange();
  };

  return (
    <Card>
      <ConfirmComponent
        opened={confirmationOpened}
        onClose={() => setConfirmationOpened(false)}
        confirmAction={async () => {
          setConfirmationOpened(false);
          await onExecute(parameters);
        }}
        title="Confirmer la déduplication"
        description="Les doublons seront supprimés directement du dataset courant."
        customConfirmProps={{ buttonColor: "brand", buttonLabel: "Dédupliquer" }}
      />
      <div className="mb-5">
        <Text weight={700} size="lg">
          Dédupliquer
        </Text>
        <Text size="sm" color="dimmed" mt={4}>
          Détecte puis supprime les lignes répétées selon une ou plusieurs colonnes clés.
        </Text>
      </div>

      <Stack spacing="md">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <Text weight={600} size="sm">
            Suggestions automatiques
          </Text>
          <Text size="xs" color="dimmed" mt={3}>
            Suggestions automatiques — vérifiez la pertinence de la clé avant de supprimer des lignes.
          </Text>

          {recommendationsQuery.loading && (
            <Group spacing="xs" mt="md">
              <Loader size="xs" />
              <Text size="xs" color="dimmed">
                Chargement des suggestions…
              </Text>
            </Group>
          )}

          {recommendationError && (
            <Alert color="yellow" mt="md" title="Suggestions indisponibles">
              {recommendationError} Vous pouvez sélectionner une clé manuellement.
            </Alert>
          )}

          {recommendationsEmpty && (
            <Text size="sm" color="dimmed" mt="md">
              Aucune suggestion automatique disponible. Sélectionnez une clé manuellement.
            </Text>
          )}

          {recommendations && !recommendationsEmpty && (
            <Stack spacing="md" mt="md">
              <RecommendationGroup
                title="Clés recommandées"
                items={recommendations.recommended}
                tone="recommended"
                onSelect={addRecommendedColumn}
                availableColumns={columns}
              />
              <RecommendationGroup
                title="Clés déconseillées"
                items={recommendations.notAdvised}
                tone="warning"
                availableColumns={columns}
              />
              <RecommendationGroup
                title="Très peu de doublons"
                items={recommendations.lowDuplicate}
                tone="info"
                availableColumns={columns}
              />
            </Stack>
          )}
        </div>

        <MultiSelect
          withAsterisk
          searchable
          clearable
          label="Clé"
          description="Sélectionnez une ou plusieurs colonnes qui identifient une ligne."
          placeholder={columns.length ? "Sélectionner la clé" : "Aucune colonne disponible"}
          data={columns.map((column) => ({ value: column, label: column }))}
          value={subset}
          onChange={updateSubset}
          disabled={busy || columns.length === 0}
          error={validationError}
        />

        <Select
          label="Occurrence à conserver"
          data={[
            { value: "first", label: "Première occurrence" },
            { value: "last", label: "Dernière occurrence" },
          ]}
          value={keep}
          onChange={(value) => setKeep((value as DeduplicationKeep) || "first")}
          disabled={busy}
        />

        {subset.length > 0 && (
          <Text size="sm" color="dimmed">
            Clé [{subset.join(", ")}]
            {analysis ? ` · ~${analysis.duplicateCount} ligne(s) à supprimer` : ""}
          </Text>
        )}

        {analysis && (
          <div className="space-y-3">
            {analysis.duplicateCount === 0 && (
              <Alert color="green" title="Aucun doublon">
                Toutes les lignes sont uniques pour la clé sélectionnée.
              </Alert>
            )}
            {analysis.duplicateRate >= HIGH_DUPLICATE_RATE && (
              <Alert color="orange" title="Attention">
                Cette clé supprimerait environ {analysis.duplicateRate}% des lignes. Vérifiez
                qu’elle identifie réellement une observation unique.
              </Alert>
            )}
            <SimpleGrid cols={4} breakpoints={[{ maxWidth: "md", cols: 2 }]}>
              <Metric label="Lignes totales" value={analysis.totalRows} />
              <Metric label="Doublons" value={analysis.duplicateCount} />
              <Metric label="Lignes après déduplication" value={analysis.uniqueRows} />
              <Metric label="Taux de doublons" value={`${analysis.duplicateRate}%`} />
            </SimpleGrid>
          </div>
        )}

        <Group position="right" spacing="sm">
          <AppButton
            intent="ghost"
            onClick={analyze}
            loading={action === "analyze"}
            disabled={busy || subset.length === 0}
          >
            Analyser
          </AppButton>
          <AppButton
            onClick={() => setConfirmationOpened(true)}
            loading={action === "deduplicate"}
            disabled={busy || !canExecute}
          >
            Dédupliquer
          </AppButton>
        </Group>

        {result && (
          <Alert color="green" title="Déduplication terminée">
            {result.rowsBefore} lignes avant · {result.rowsAfter} lignes après · {result.rowsRemoved}{" "}
            ligne(s) supprimée(s).
          </Alert>
        )}
      </Stack>
    </Card>
  );
}
