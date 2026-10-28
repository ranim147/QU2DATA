import { Text } from "@mantine/core";
import { Card } from "../../../ui";
import { ImputationParameters } from "../types";
import ImputationForm from "./form";

interface Props {
  columns: string[];
  loading: boolean;
  onPreview: (parameters: ImputationParameters) => Promise<void>;
}

export default function ImputationPanel(props: Props) {
  return (
    <Card>
      <div className="mb-5">
        <Text weight={700} size="lg">
          Imputer les valeurs manquantes
        </Text>
        <Text size="sm" color="dimmed" mt={4}>
          Remplace les valeurs absentes des colonnes sélectionnées sans modifier
          le dataset courant avant validation du preview.
        </Text>
      </div>
      <ImputationForm {...props} />
    </Card>
  );
}

