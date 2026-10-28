import {
  Alert,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { useEffect, useMemo, useRef, useState } from "react";
import ConfirmComponent from "../../../layout/confirmComponent";
import { AppButton, Card } from "../../../ui";
import {
  OutlierAction,
  OutlierAnalysisResult,
  OutlierMethod,
  OutlierParameters,
  OutlierTreatmentResult,
} from "../types";

interface Props {
  fileId: string;
  columns: string[];
  action: "analyzeOutliers" | "treatOutliers" | null;
  analysis: OutlierAnalysisResult | null;
  result: OutlierTreatmentResult | null;
  onAnalyze: (parameters: OutlierParameters) => Promise<OutlierAnalysisResult | null>;
  onExecute: (parameters: OutlierParameters) => Promise<void>;
  onParametersChange: () => void;
}

const DEFAULT_FACTORS: Record<OutlierMethod, number> = {
  iqr: 1.5,
  zscore: 3,
  grubbs: 0.05,
};

const METHOD_OPTIONS = [
  { value: "iqr", label: "IQR" },
  { value: "zscore", label: "Z-score" },
  { value: "grubbs", label: "Grubbs" },
];

const ACTION_OPTIONS = [
  { value: "delete", label: "Supprimer les lignes" },
  { value: "replace_median", label: "Remplacer par la médiane" },
  { value: "replace_mean", label: "Remplacer par la moyenne" },
  { value: "mark", label: "Marquer les valeurs aberrantes" },
  { value: "ignore", label: "Ignorer" },
];

function displayValue(value: unknown) {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function Metric({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <Text size="xs" color="dimmed">{label}</Text>
      <Text weight={700} mt={2}>{displayValue(value)}</Text>
    </div>
  );
}

export default function OutlierPanel({
  fileId,
  columns,
  action,
  analysis,
  result,
  onAnalyze,
  onExecute,
  onParametersChange,
}: Props) {
  const [column, setColumn] = useState<string | null>(null);
  const [method, setMethod] = useState<OutlierMethod>("iqr");
  const [factor, setFactor] = useState<number | "">(DEFAULT_FACTORS.iqr);
  const [actionValue, setActionValue] = useState<OutlierAction>("delete");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmationOpened, setConfirmationOpened] = useState(false);
  const [analyzedFingerprint, setAnalyzedFingerprint] = useState<string | null>(null);
  const factorEdited = useRef(false);

  useEffect(() => {
    setColumn(null);
    setMethod("iqr");
    setFactor(DEFAULT_FACTORS.iqr);
    setActionValue("delete");
    setValidationError(null);
    setConfirmationOpened(false);
    setAnalyzedFingerprint(null);
    factorEdited.current = false;
  }, [fileId]);

  useEffect(() => {
    if (column && !columns.includes(column)) {
      setColumn(null);
      setAnalyzedFingerprint(null);
      onParametersChange();
    }
  }, [column, columns, onParametersChange]);

  const numericFactor = typeof factor === "number" && Number.isFinite(factor) ? factor : null;
  const fingerprint = column && numericFactor !== null
    ? JSON.stringify([column, method, numericFactor])
    : null;
  const parameters = useMemo<OutlierParameters | null>(
    () => column && numericFactor !== null
      ? { column, method, action: actionValue, factor: numericFactor, preview: true }
      : null,
    [actionValue, column, method, numericFactor]
  );
  const selectedAnalysis = column ? analysis?.results[column] : undefined;
  const outlierCount = typeof selectedAnalysis?.outlier_count === "number"
    ? selectedAnalysis.outlier_count
    : 0;
  const analysisCurrent = Boolean(
    analysis && fingerprint && analyzedFingerprint === fingerprint
  );
  const busy = action === "analyzeOutliers" || action === "treatOutliers";
  const canExecute = analysisCurrent && outlierCount > 0 && Boolean(parameters);

  const invalidateAnalysis = () => {
    setAnalyzedFingerprint(null);
    setValidationError(null);
    onParametersChange();
  };

  const changeMethod = (value: string | null) => {
    const nextMethod = (value as OutlierMethod | null) || "iqr";
    setMethod(nextMethod);
    if (!factorEdited.current) setFactor(DEFAULT_FACTORS[nextMethod]);
    invalidateAnalysis();
  };

  const analyze = async () => {
    if (!parameters || parameters.factor < 0.01 || parameters.factor > 10) {
      setValidationError("Sélectionnez une variable et saisissez un facteur entre 0,01 et 10.");
      return;
    }
    setValidationError(null);
    const analyzed = await onAnalyze(parameters);
    setAnalyzedFingerprint(analyzed ? fingerprint : null);
  };

  const confirmationDescription = actionValue === "delete"
    ? `Cette action supprimera environ ${outlierCount} ligne(s) de current.csv.`
    : `Cette action traitera environ ${outlierCount} valeur(s) aberrante(s) dans current.csv.`;

  return (
    <Card>
      <ConfirmComponent
        opened={confirmationOpened}
        onClose={() => setConfirmationOpened(false)}
        confirmAction={async () => {
          setConfirmationOpened(false);
          if (parameters) await onExecute(parameters);
        }}
        title="Confirmer le traitement"
        description={confirmationDescription}
        customConfirmProps={{
          buttonColor: actionValue === "delete" ? undefined : "brand",
          buttonLabel: "Traiter",
        }}
      />

      <div className="mb-5">
        <Text weight={700} size="lg">Traiter les valeurs aberrantes</Text>
        <Text size="sm" color="dimmed" mt={4}>
          Analysez une variable numérique avant d'appliquer un traitement au dataset courant.
        </Text>
      </div>

      <Stack spacing="md">
        <Select
          withAsterisk
          searchable
          clearable
          label="Variable"
          placeholder={columns.length ? "Sélectionner une variable" : "Aucune colonne disponible"}
          description="Les types de colonnes ne sont pas disponibles ici ; choisissez une variable numérique."
          data={columns.map((item) => ({ value: item, label: item }))}
          value={column}
          onChange={(value) => {
            setColumn(value);
            invalidateAnalysis();
          }}
          disabled={busy || columns.length === 0}
        />

        <SimpleGrid cols={2} breakpoints={[{ maxWidth: "sm", cols: 1 }]}> 
          <Select
            label="Méthode"
            data={METHOD_OPTIONS}
            value={method}
            onChange={changeMethod}
            disabled={busy}
          />
          <NumberInput
            withAsterisk
            label="Seuil / facteur"
            value={factor}
            min={0.01}
            max={10}
            precision={method === "grubbs" ? 2 : 1}
            step={method === "grubbs" ? 0.01 : 0.1}
            onChange={(value) => {
              factorEdited.current = true;
              setFactor(value);
              invalidateAnalysis();
            }}
            disabled={busy}
            error={validationError}
          />
        </SimpleGrid>

        <Select
          label="Action"
          data={ACTION_OPTIONS}
          value={actionValue}
          onChange={(value) => setActionValue((value as OutlierAction | null) || "delete")}
          disabled={busy}
        />

        <Group position="right">
          <AppButton
            intent="ghost"
            onClick={analyze}
            loading={action === "analyzeOutliers"}
            disabled={busy || !column || numericFactor === null}
          >
            Analyser
          </AppButton>
        </Group>

        {analysisCurrent && selectedAnalysis && (
          <div className="space-y-3">
            {outlierCount === 0 ? (
              <Alert color="green" title="Aucune valeur aberrante">
                Aucun outlier n'a été détecté avec ces paramètres.
              </Alert>
            ) : (
              <Alert color="blue" title="Analyse terminée">
                {outlierCount} valeur(s) aberrante(s) détectée(s).
              </Alert>
            )}
            <SimpleGrid cols={3} breakpoints={[{ maxWidth: "md", cols: 2 }, { maxWidth: "xs", cols: 1 }]}> 
              <Metric label="Méthode" value={selectedAnalysis.method ?? method} />
              <Metric label="Facteur / seuil" value={selectedAnalysis.factor ?? selectedAnalysis.threshold ?? selectedAnalysis.alpha ?? numericFactor} />
              <Metric label="Nombre d'outliers" value={outlierCount} />
              {selectedAnalysis.lower_bound !== undefined && <Metric label="Borne basse" value={selectedAnalysis.lower_bound} />}
              {selectedAnalysis.upper_bound !== undefined && <Metric label="Borne haute" value={selectedAnalysis.upper_bound} />}
              {selectedAnalysis.Q1 !== undefined && <Metric label="Q1" value={selectedAnalysis.Q1} />}
              {selectedAnalysis.Q3 !== undefined && <Metric label="Q3" value={selectedAnalysis.Q3} />}
              {selectedAnalysis.IQR !== undefined && <Metric label="IQR" value={selectedAnalysis.IQR} />}
            </SimpleGrid>
            <Metric label="Valeurs" value={selectedAnalysis.outlier_values} />
            <Metric label="Indices" value={selectedAnalysis.outlier_indices} />
          </div>
        )}

        <Group position="right">
          <AppButton
            onClick={() => setConfirmationOpened(true)}
            loading={action === "treatOutliers"}
            disabled={busy || !canExecute}
          >
            Traiter les valeurs aberrantes
          </AppButton>
        </Group>

        {result && (
          <Alert color="green" title="Traitement terminé">
            {result.outliersTreated} valeur(s) aberrante(s) traitée(s) · {result.rows} ligne(s) dans le dataset courant.
          </Alert>
        )}
      </Stack>
    </Card>
  );
}
