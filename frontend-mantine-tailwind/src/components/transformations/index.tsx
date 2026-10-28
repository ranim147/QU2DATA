import {
  Alert,
  Badge,
  Group,
  LoadingOverlay,
  Text,
  ThemeIcon,
  UnstyledButton,
  ScrollArea,
} from "@mantine/core";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "next-i18next";
import ConfirmComponent from "../../layout/confirmComponent";
import { AppButton, AppTable, Card, PageHeader } from "../../ui";
import DatasetTable from "./DatasetTable";
import TransformationStatusBadge from "./TransformationStatusBadge";
import { useTransformationPipeline } from "./hooks";
import ImputationPanel from "./imputation";
import DeduplicationPanel from "./deduplication";
import OutlierPanel from "./outliers";
import StandardizationPanel from "./standardization";
import NormalizationPanel from "./normalization";
import EncodingPanel from "./encoding";
import LogTransformPanel from "./log-transform";
import BinningPanel from "./binning";
import RecodePanel from "./recode";
import RowOperationsPanel from "./row-operations";
import ConcatPanel from "./concat";
import CalculatePanel from "./calculate";
import TypeCorrectionPanel from "./type-correction";
import { Transformation } from "./types";
import type { Icon } from "@tabler/icons-react";
import { useMutation } from "@apollo/client";
import { DELETE_TRANSFORMATION } from "./mutation";
import {
  IconAlertTriangle,
  IconArrowsExchange,
  IconArrowsLeftRight,
  IconArrowsSort,
  IconBinaryTree,
  IconCalculator,
  IconChartHistogram,
  IconColumns,
  IconCopy,
  IconEye,
  IconFilter,
  IconHierarchy2,
  IconReplace,
  IconScale,
  IconWand,
  IconTrash,
  IconSelector,
  IconChevronUp,
  IconChevronDown,
} from "@tabler/icons-react";

interface Props {
  projectId?: string;
  fileId: string;
}

interface Operation {
  key: string;
  label: string;
  description: string;
  icon: Icon;
  color: string;
  enabled: boolean;
}

type HistorySortField = "name" | "type" | "status" | "parameters" | "createdAt" | "errorMessage";
type SortDirection = "asc" | "desc";

interface SortableHeaderProps {
  label: string;
  field: HistorySortField;
  activeField: HistorySortField;
  direction: SortDirection;
  onSort: (field: HistorySortField) => void;
}

function SortableHeader({ label, field, activeField, direction, onSort }: SortableHeaderProps) {
  const active = field === activeField;
  const Icon = active ? direction === "asc" ? IconChevronUp : IconChevronDown : IconSelector;
  return (
    <th aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}>
      <UnstyledButton onClick={() => onSort(field)} title={`Trier par ${label}`} className="flex items-center gap-1 whitespace-nowrap font-semibold">
        <span>{label}</span><Icon size={15} aria-hidden="true" />
      </UnstyledButton>
    </th>
  );
}

const STATUS_ORDER: Record<string, number> = { PENDING: 0, PREVIEWED: 1, APPLIED: 2, CANCELLED: 3, FAILED: 4 };

function historyTimestamp(value?: string | null): number | null {
  if (value === null || value === undefined || value.trim() === "") return null;
  const numeric = Number(value);
  const timestamp = Number.isFinite(numeric) && /^\d+$/.test(value.trim()) ? (numeric < 1_000_000_000_000 ? numeric * 1000 : numeric) : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function compareNullable<T>(left: T | null, right: T | null, compare: (a: T, b: T) => number, direction: SortDirection): number {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  const result = compare(left, right);
  return direction === "asc" ? result : -result;
}

const operations: Operation[] = [
  {
    key: "concat",
    label: "Concaténer",
    description: "Combiner plusieurs colonnes",
    icon: IconColumns,
    color: "cyan",
    enabled: true,
  },
  {
    key: "calculate",
    label: "Calculer une variable",
    description: "Créer une colonne avec une formule",
    icon: IconCalculator,
    color: "blue",
    enabled: true,
  },
  {
    key: "deduplication",
    label: "Dédupliquer",
    description: "Suppression des doublons sur clé",
    icon: IconCopy,
    color: "cyan",
    enabled: true,
  },
  {
    key: "imputation",
    label: "Imputer manquants",
    description: "Moyenne · médiane · mode · KNN",
    icon: IconWand,
    color: "indigo",
    enabled: true,
  },
  {
    key: "outliers",
    label: "Traiter outliers",
    description: "Winsoriser · supprimer · capper",
    icon: IconAlertTriangle,
    color: "orange",
    enabled: true,
  },
  {
    key: "standardization",
    label: "Standardiser",
    description: "Z-score · Min-Max · Robust",
    icon: IconArrowsLeftRight,
    color: "teal",
    enabled: true,
  },
  {
    key: "normalization",
    label: "Normaliser",
    description: "Ramener les valeurs entre 0 et 1",
    icon: IconScale,
    color: "green",
    enabled: true,
  },
  {
    key: "log",
    label: "Log-transformation",
    description: "ln(x+1) · normaliser la distribution",
    icon: IconChartHistogram,
    color: "pink",
    enabled: true,
  },
  {
    key: "binning",
    label: "Discrétiser",
    description: "Quantiles · seuils · Sturges",
    icon: IconHierarchy2,
    color: "cyan",
    enabled: true,
  },
  {
    key: "encoding",
    label: "Encodage 0/1",
    description: "One-hot pour variable nominale",
    icon: IconBinaryTree,
    color: "indigo",
    enabled: true,
  },
  {
    key: "recode",
    label: "Recoder",
    description: "Fusionner ou renommer les modalités",
    icon: IconReplace,
    color: "pink",
    enabled: true,
  },
  {
    key: "view",
    label: "Afficher lignes",
    description: "Afficher une vue du dataset",
    icon: IconEye,
    color: "blue",
    enabled: true,
  },
  {
    key: "sort",
    label: "Trier lignes",
    description: "Ordre croissant ou décroissant",
    icon: IconArrowsSort,
    color: "grape",
    enabled: true,
  },
  {
    key: "filter",
    label: "Filtrer lignes",
    description: "Conditions AND / OR",
    icon: IconFilter,
    color: "cyan",
    enabled: true,
  },
  {
    key: "types",
    label: "Corriger types",
    description: "Auto-cast date · num · bool",
    icon: IconArrowsExchange,
    color: "teal",
    enabled: true,
  },
];

const PARAMETER_LABELS: Record<string, string> = {
  columns: "Colonnes",
  column: "Colonne",
  subset: "Colonnes",
  overwrite: "Écraser la colonne",
  separator: "Séparateur",
  new_column: "Nouvelle colonne",
  keep_original: "Conserver les colonnes originales",
  keep: "Occurrence conservée",
  target_type: "Type cible",
  method: "Méthode",
  strategy: "Stratégie",
};

const HIDDEN_PARAMETER_KEYS = new Set(["preview"]);

function formatDate(value?: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const numericValue = Number(value);
  let date: Date;

  if (!Number.isNaN(numericValue) && /^\d+$/.test(String(value))) {
    const timestamp =
      numericValue < 1_000_000_000_000
        ? numericValue * 1000
        : numericValue;

    date = new Date(timestamp);
  } else {
    date = new Date(String(value));
  }

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatParameters(transformation: Transformation) {
  if (!transformation.parameters) {
    return "—";
  }

  let parameters: Record<string, unknown>;

  try {
    parameters =
      typeof transformation.parameters === "string"
        ? JSON.parse(transformation.parameters)
        : (transformation.parameters as Record<string, unknown>);
  } catch {
    return String(transformation.parameters);
  }

  const formattedParameters = Object.entries(parameters)
    .filter(([key]) => !HIDDEN_PARAMETER_KEYS.has(key))
    .map(([key, value]) => {
      const label =
        PARAMETER_LABELS[key] ??
        key
          .replace(/_/g, " ")
          .replace(/^./, (character) => character.toUpperCase());

      let formattedValue: string;

      if (key === "keep") {
        const keepLabels: Record<string, string> = {
          first: "Première occurrence",
          last: "Dernière occurrence",
          false: "Aucune occurrence",
        };

        formattedValue = keepLabels[String(value)] ?? String(value);
      } else if (Array.isArray(value)) {
        formattedValue = value.join(", ");
      } else if (typeof value === "boolean") {
        formattedValue = value ? "Oui" : "Non";
      } else if (value === null || value === undefined || value === "") {
        formattedValue = "—";
      } else {
        formattedValue = String(value);
      }

      return `${label} : ${formattedValue}`;
    });

  return formattedParameters.length > 0
    ? formattedParameters.join(" • ")
    : "—";
}

export default function TransformationPipeline({ projectId, fileId }: Props) {
  const { t } = useTranslation("transformations");
  const [transformationToDelete, setTransformationToDelete] =
  useState<Transformation | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteLock = useRef(false);
  const [sortField, setSortField] = useState<HistorySortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

const [deleteTransformation, { loading: deletingTransformation }] =
  useMutation(DELETE_TRANSFORMATION);
  const [selectedOperation, setSelectedOperation] = useState("imputation");
  const [applyConfirmation, setApplyConfirmation] = useState(false);
  const [cancelConfirmation, setCancelConfirmation] = useState(false);
  const pipeline = useTransformationPipeline(fileId);
  const isPreviewed = pipeline.activeTransformation?.status === "PREVIEWED";
  const handleSort = (field: HistorySortField) => {
    if (field === sortField) {
      setSortDirection((direction) => direction === "asc" ? "desc" : "asc");
      return;
    }
    setSortField(field);
    setSortDirection("asc");
  };
  const sortedHistory = useMemo(() => pipeline.history.map((transformation, index) => ({ transformation, index })).sort((leftEntry, rightEntry) => {
    const left = leftEntry.transformation;
    const right = rightEntry.transformation;
    let comparison = 0;
    if (sortField === "createdAt") {
      comparison = compareNullable(historyTimestamp(left.createdAt), historyTimestamp(right.createdAt), (a, b) => a - b, sortDirection);
    } else if (sortField === "status") {
      const leftStatus = left.status ? STATUS_ORDER[left.status] ?? null : null;
      const rightStatus = right.status ? STATUS_ORDER[right.status] ?? null : null;
      comparison = compareNullable(leftStatus, rightStatus, (a, b) => a - b, sortDirection);
    } else {
      const leftValue = sortField === "parameters" ? (left.parameters ? formatParameters(left) : null) : sortField === "name" ? left.name?.trim() || null : sortField === "type" ? left.type?.trim() || null : left.errorMessage?.trim() || null;
      const rightValue = sortField === "parameters" ? (right.parameters ? formatParameters(right) : null) : sortField === "name" ? right.name?.trim() || null : sortField === "type" ? right.type?.trim() || null : right.errorMessage?.trim() || null;
      comparison = compareNullable(leftValue, rightValue, (a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }), sortDirection);
    }
    return comparison || leftEntry.index - rightEntry.index;
  }).map(({ transformation }) => transformation), [pipeline.history, sortDirection, sortField]);
  const numericColumns = useMemo(() => {
    const dataset = pipeline.currentDataset;
    if (!dataset) return [];
    return dataset.columns.filter((column) => {
      const values = dataset.data
        .map((row) => row[column])
        .filter((value) => value !== null && value !== undefined && value !== "");
      return (
        values.length > 0 &&
        values.every(
          (value) =>
            typeof value === "number" && Number.isFinite(value)
        )
      );
    });
  }, [pipeline.currentDataset]);
  const categoricalColumns = useMemo(() => {
    const dataset = pipeline.currentDataset;
    if (!dataset) return [];

    return dataset.columns.filter((column) => {
      const values = dataset.data
        .map((row) => row[column])
        .filter((value) => value !== null && value !== undefined && value !== "");
      if (values.length === 0) return false;
      if (values.every((value) => typeof value === "boolean")) return true;
      if (values.every((value) => typeof value === "string")) return true;
      if (!values.every((value) => typeof value === "number")) return false;

      const looksLikeIdentifier = /(^id$|_id$|id_|identifier|identifiant)/i.test(column);
      const uniqueCount = new Set(values).size;
      const uniqueRatio = uniqueCount / values.length;
      return !looksLikeIdentifier && uniqueCount <= 20 && uniqueRatio < 0.8;
    });
  }, [pipeline.currentDataset]);

  const confirmApply = async () => {
    setApplyConfirmation(false);
    await pipeline.apply();
  };

  const confirmCancel = async () => {
    setCancelConfirmation(false);
    await pipeline.cancel();
  };

  const handleDeleteTransformation = async () => {
  if (!transformationToDelete || deletingTransformation || deleteLock.current) {
    return;
  }

  deleteLock.current = true;
  setDeleteError(null);
  try {
    const { data } = await deleteTransformation({
      variables: {
        id: transformationToDelete.id,
      },
    });

    if (!data?.deleteTransformation?.success) {
      throw new Error(
        data?.deleteTransformation?.message ||
          "Impossible de supprimer la transformation.",
      );
    }

    setTransformationToDelete(null);
    await pipeline.refetchHistory();
  } catch (error) {
    console.error("Erreur lors de la suppression :", error);
    setDeleteError(error instanceof Error ? error.message : "Impossible de supprimer la transformation.");
  } finally {
    deleteLock.current = false;
  }
};


  return (
    <div className="relative min-h-[480px]">
      <LoadingOverlay
        visible={pipeline.loading && !pipeline.currentDataset}
        overlayBlur={1}
      />

      <ConfirmComponent
        opened={applyConfirmation}
        onClose={() => setApplyConfirmation(false)}
        confirmAction={confirmApply}
        title="Appliquer la transformation"
        description="Le preview remplacera le dataset courant. Cette action confirme l'étape d'imputation."
        customConfirmProps={{ buttonColor: "brand", buttonLabel: "Appliquer" }}
      />

      <ConfirmComponent
        opened={cancelConfirmation}
        onClose={() => setCancelConfirmation(false)}
        confirmAction={confirmCancel}
        title="Annuler le preview"
        description="Le preview sera supprimé et le dataset courant restera inchangé."
        customConfirmProps={{ buttonLabel: "Annuler le preview" }}
      />

      <ConfirmComponent
        opened={Boolean(transformationToDelete)}
        onClose={() => { if (!deletingTransformation) { setTransformationToDelete(null); setDeleteError(null); } }}
        confirmAction={handleDeleteTransformation}
        title="Supprimer la transformation"
        description={`Voulez-vous vraiment supprimer "${
          transformationToDelete?.name || "cette transformation"
        }" de l'historique ?`}
        customConfirmProps={{
          buttonColor: "red",
          buttonLabel: deletingTransformation
            ? "Suppression..."
            : "Supprimer",
        }}
      />

      <PageHeader
        title="Pipeline de transformations"
        subtitle={
          pipeline.fileName
            ? projectId
              ? `${pipeline.fileName} · Projet ${projectId}`
              : pipeline.fileName
            : projectId
            ? `Fichier ${fileId} · Projet ${projectId}`
            : `Fichier ${fileId}`
        }
        action={
          <Group spacing="xs" position="right">
            <TransformationStatusBadge
              status={pipeline.activeTransformation?.status}
            />
            {selectedOperation === "imputation" && isPreviewed && (
              <>
                <AppButton
                  intent="ghost"
                  size="xs"
                  disabled={Boolean(pipeline.action)}
                  loading={pipeline.action === "cancel"}
                  onClick={() => setCancelConfirmation(true)}
                >
                  Cancel
                </AppButton>
                <AppButton
                  size="xs"
                  disabled={Boolean(pipeline.action)}
                  loading={pipeline.action === "apply"}
                  onClick={() => setApplyConfirmation(true)}
                >
                  Apply
                </AppButton>
              </>
            )}
          </Group>
        }
      />

      {pipeline.error && (
        <Alert color="red" title="Chargement impossible" mb="md">
          {pipeline.error}
        </Alert>
      )}
      {deleteError && <Alert color="red" title="Suppression impossible" mb="md" withCloseButton onClose={() => setDeleteError(null)}>{deleteError}</Alert>}

      {pipeline.feedback && (
        <Alert
          color={pipeline.feedback.color}
          withCloseButton
          onClose={pipeline.dismissFeedback}
          mb="md"
        >
          {pipeline.feedback.message}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px,minmax(0,1fr)]">
 <Card>
  <Text weight={700}>Catalogue d'opérations</Text>

  <Text size="xs" color="dimmed" mt={3} mb="md">
    Sélectionnez une étape à configurer.
  </Text>

  <div className="max-h-[600px] space-y-2 overflow-y-auto pr-2">
    {operations.map((operation) => {
      const selected = selectedOperation === operation.key;
      const OperationIcon = operation.icon;

      return (
        <UnstyledButton
          key={operation.key}
          disabled={!operation.enabled}
          onClick={() =>
            operation.enabled && setSelectedOperation(operation.key)
          }
          className={`w-full rounded-xl border p-3 text-left transition-all ${
            selected
              ? "border-[#84BF43] bg-[#f3fadf] shadow-sm"
              : "border-transparent bg-white hover:border-gray-200 hover:bg-gray-50"
          } ${
            !operation.enabled ? "cursor-not-allowed opacity-60" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <ThemeIcon
              color={operation.color}
              variant="light"
              radius="md"
              size={48}
            >
              <OperationIcon size={26} stroke={1.8} />
            </ThemeIcon>

            <div className="min-w-0 flex-1">
              <Text size="sm" weight={selected ? 700 : 600}>
                {operation.key === "standardization"
                  ? t("catalog.standardization")
                  : operation.key === "normalization"
                  ? t("catalog.normalization")
                  : operation.key === "encoding"
                  ? t("catalog.encoding")
                  : operation.key === "log"
                  ? t("catalog.logTransform")
                  : operation.key === "binning"
                  ? t("catalog.binning")
                  : operation.key === "recode"
                  ? t("catalog.recode")
                  : operation.key === "view" ||
                    operation.key === "sort" ||
                    operation.key === "filter"
                  ? t(`catalog.${operation.key}`)
                  : operation.key === "concat" ||
                    operation.key === "calculate"
                  ? t(`catalog.${operation.key}`)
                  : operation.key === "types"
                  ? t("catalog.typeCorrection")
                  : operation.label}
              </Text>

              <Text size="xs" color="dimmed" mt={2} lineClamp={2}>
                {operation.description}
              </Text>

              {!operation.enabled && (
                <Badge color="gray" variant="light" size="xs" mt={4}>
                  Bientôt disponible
                </Badge>
              )}
            </div>
          </div>
        </UnstyledButton>
      );
    })}
  </div>
</Card>

        <div className="min-w-0 space-y-6">
          {selectedOperation === "imputation" && (
            <ImputationPanel
              columns={pipeline.currentDataset?.columns ?? []}
              loading={pipeline.action === "preview"}
              onPreview={pipeline.preview}
            />
          )}

          {selectedOperation === "deduplication" && (
            <DeduplicationPanel
              fileId={fileId}
              columns={pipeline.currentDataset?.columns ?? []}
              action={
                pipeline.action === "analyze" || pipeline.action === "deduplicate"
                  ? pipeline.action
                  : null
              }
              analysis={pipeline.duplicateAnalysis}
              result={pipeline.deduplicationResult}
              onAnalyze={pipeline.analyzeDeduplication}
              onExecute={pipeline.runDeduplication}
              onParametersChange={pipeline.resetDeduplication}
            />
          )}

          {selectedOperation === "outliers" && (
            <OutlierPanel
              fileId={fileId}
              columns={pipeline.currentDataset?.columns ?? []}
              action={
                pipeline.action === "analyzeOutliers" ||
                pipeline.action === "treatOutliers"
                  ? pipeline.action
                  : null
              }
              analysis={pipeline.outlierAnalysis}
              result={pipeline.outlierTreatmentResult}
              onAnalyze={pipeline.analyzeOutlierValues}
              onExecute={pipeline.runOutlierTreatment}
              onParametersChange={pipeline.resetOutliers}
            />
          )}

          {selectedOperation === "standardization" && (
            <StandardizationPanel
              columns={numericColumns}
              loading={pipeline.action === "standardize"}
              onSubmit={pipeline.runStandardization}
            />
          )}

          {selectedOperation === "normalization" && (
            <NormalizationPanel
              key={pipeline.normalizationRevision}
              columns={numericColumns}
              loading={pipeline.action === "normalize"}
              onSubmit={pipeline.runNormalization}
            />
          )}

          {selectedOperation === "encoding" && (
            <EncodingPanel
              key={pipeline.encodingRevision}
              columns={categoricalColumns}
              loading={pipeline.action === "encode"}
              onSubmit={pipeline.runOneHotEncoding}
            />
          )}

          {selectedOperation === "log" && (
            <LogTransformPanel
              key={pipeline.logTransformRevision}
              columns={numericColumns}
              action={
                pipeline.action === "analyzeLog" ||
                pipeline.action === "transformLog"
                  ? pipeline.action
                  : null
              }
              analysis={pipeline.logTransformAnalysis}
              onAnalyze={pipeline.analyzeLogTransformation}
              onExecute={pipeline.runLogTransformation}
              onParametersChange={pipeline.resetLogTransformation}
            />
          )}

          {selectedOperation === "binning" && (
            <BinningPanel
              key={pipeline.binningRevision}
              columns={numericColumns}
              loading={pipeline.action === "binning"}
              onSubmit={pipeline.runBinning}
            />
          )}

          {selectedOperation === "recode" && (
            <RecodePanel
              key={pipeline.recodeRevision}
              columns={pipeline.currentDataset?.columns ?? []}
              loading={pipeline.action === "recode"}
              onSubmit={pipeline.runRecode}
            />
          )}
          {selectedOperation === "concat" && <ConcatPanel key={pipeline.concatRevision} columns={pipeline.currentDataset?.columns ?? []} loading={pipeline.action === "concat"} onSubmit={pipeline.runConcat} />}
          {selectedOperation === "calculate" && <CalculatePanel key={pipeline.calculateRevision} columns={numericColumns} loading={pipeline.action === "calculate"} onSubmit={pipeline.runCalculate} />}
          {selectedOperation === "types" && <TypeCorrectionPanel key={pipeline.typeCorrectionRevision} fileId={fileId} columns={pipeline.currentDataset?.columns??[]} recommendations={pipeline.typeRecommendations} result={pipeline.typeCorrectionResult} action={pipeline.action} onLoad={pipeline.loadTypeRecommendations} onTest={pipeline.runTypeCorrection} onConfirm={pipeline.confirmTypeCorrection} onCancel={pipeline.cancelTypeCorrection}/>} 

          {(["view", "sort", "filter"] as const).map((mode) => selectedOperation === mode && (
            <RowOperationsPanel key={mode} mode={mode} fileId={fileId} columns={pipeline.currentDataset?.columns ?? []} source={pipeline.currentDataset} />
          ))}

          {selectedOperation === "imputation" &&
            pipeline.previewVisible &&
            pipeline.currentDataset &&
            pipeline.previewDataset && (
              <div>
                <div className="mb-3">
                  <Text weight={700} size="lg">
                    Comparaison du preview
                  </Text>
                  <Text size="sm" color="dimmed">
                    Les cellules colorées représentent les valeurs modifiées.
                  </Text>
                </div>
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <DatasetTable
                    title="Avant"
                    dataset={pipeline.currentDataset}
                    comparison={pipeline.previewDataset}
                    tone="before"
                  />
                  <DatasetTable
                    title="Après"
                    dataset={pipeline.previewDataset}
                    comparison={pipeline.currentDataset}
                    tone="after"
                  />
                </div>
              </div>
            )}
        </div>
      </div>

      <Card padding={false} className="mt-6">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <Text weight={700}>Historique des transformations</Text>
            <Text size="xs" color="dimmed">
              {pipeline.historyCount} transformation(s) enregistrée(s)
            </Text>
          </div>
        </div>

        <div className="max-h-[600px] overflow-auto">
          <AppTable>
            <thead>
              <tr>
                <SortableHeader label="Nom" field="name" activeField={sortField} direction={sortDirection} onSort={handleSort} />
                <SortableHeader label="Type" field="type" activeField={sortField} direction={sortDirection} onSort={handleSort} />
                <SortableHeader label="Statut" field="status" activeField={sortField} direction={sortDirection} onSort={handleSort} />
                <SortableHeader label="Paramètres" field="parameters" activeField={sortField} direction={sortDirection} onSort={handleSort} />
                <SortableHeader label="Créée le" field="createdAt" activeField={sortField} direction={sortDirection} onSort={handleSort} />
                <SortableHeader label="Erreur" field="errorMessage" activeField={sortField} direction={sortDirection} onSort={handleSort} />
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedHistory.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <Text align="center" color="dimmed" size="sm" py="lg">
                      Aucune transformation pour ce fichier.
                    </Text>
                  </td>
                </tr>
              ) : (
                sortedHistory.map((transformation) => (
                  <tr key={transformation.id}>
                    <td className="whitespace-nowrap font-medium">
                      {transformation.name || "—"}
                    </td>
                    <td>{transformation.type || "—"}</td>
                    <td>
                      <TransformationStatusBadge status={transformation.status} />
                    </td>
                      <td className="max-w-md align-top">
                        <Text
                          size="xs"
                          color="dimmed"
                          className="leading-5"
                        >
                          {formatParameters(transformation)}
                        </Text>
                      </td>
                    <td className="min-w-[150px] whitespace-nowrap text-xs">
                      {formatDate(transformation.createdAt)}
                    </td>
                    <td>
                      {transformation.errorMessage ? (
                        <Text size="xs" color="red">
                          {transformation.errorMessage}
                        </Text>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="whitespace-nowrap">
                        <UnstyledButton
                          disabled={deletingTransformation && transformationToDelete?.id === transformation.id}
                          onClick={() => setTransformationToDelete(transformation)}
                          title="Supprimer la transformation"
                          className="rounded-md p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <IconTrash size={18} className={deletingTransformation && transformationToDelete?.id === transformation.id ? "opacity-40" : undefined} />
                        </UnstyledButton>
                      </td>
                  </tr>
                ))
              )}
            </tbody>
          </AppTable>
        </div>
      </Card>
    </div>
  );
}
