import { MultiSelect, NumberInput, Select, Stack, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { AppButton } from "../../../ui";
import { ImputationMethod, ImputationParameters } from "../types";

interface FormValues {
  columns: string[];
  method: ImputationMethod;
  n_neighbors: number;
}

interface Props {
  columns: string[];
  loading: boolean;
  onPreview: (parameters: ImputationParameters) => Promise<void>;
}

const methods = [
  { value: "mean", label: "Moyenne (mean)" },
  { value: "median", label: "Médiane (median)" },
  { value: "mode", label: "Mode (valeur la plus fréquente)" },
  { value: "knn", label: "K plus proches voisins (KNN)" },
];

export default function ImputationForm({ columns, loading, onPreview }: Props) {
  const form = useForm<FormValues>({
    initialValues: {
      columns: [],
      method: "mean",
      n_neighbors: 5,
    },
    validate: {
      columns: (value) =>
        value.length > 0 ? null : "Sélectionnez au moins une colonne.",
      n_neighbors: (value, values) =>
        values.method !== "knn" || (value >= 1 && Number.isInteger(value))
          ? null
          : "Le nombre de voisins doit être un entier supérieur ou égal à 1.",
    },
  });

  const submit = async (values: FormValues) => {
    await onPreview({
      method: values.method,
      columns: values.columns,
      n_neighbors: values.method === "knn" ? values.n_neighbors : 5,
    });
  };

  return (
    <form onSubmit={form.onSubmit(submit)}>
      <Stack spacing="md">
        <MultiSelect
          withAsterisk
          searchable
          clearable
          label="Colonnes à imputer"
          description="Les méthodes mean, median et knn s'appliquent aux colonnes numériques."
          placeholder={
            columns.length > 0
              ? "Sélectionner une ou plusieurs colonnes"
              : "Aucune colonne disponible"
          }
          data={columns.map((column) => ({ value: column, label: column }))}
          disabled={loading || columns.length === 0}
          {...form.getInputProps("columns")}
        />

        <Select
          withAsterisk
          label="Méthode d'imputation"
          data={methods}
          disabled={loading}
          {...form.getInputProps("method")}
        />

        {form.values.method === "knn" && (
          <NumberInput
            withAsterisk
            label="Nombre de voisins"
            description="Nombre d'observations proches utilisées par KNN."
            min={1}
            step={1}
            disabled={loading}
            {...form.getInputProps("n_neighbors")}
          />
        )}

        {columns.length === 0 && (
          <Text size="sm" color="orange">
            Le dataset courant doit être chargé avant de configurer l'imputation.
          </Text>
        )}

        <div className="flex justify-end">
          <AppButton
            type="submit"
            loading={loading}
            disabled={loading || columns.length === 0}
          >
            Prévisualiser
          </AppButton>
        </div>
      </Stack>
    </form>
  );
}

