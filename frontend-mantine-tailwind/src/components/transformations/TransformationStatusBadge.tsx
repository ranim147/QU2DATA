import { Badge } from "@mantine/core";
import { TransformationStatus } from "./types";

interface Props {
  status?: TransformationStatus | null;
}

const statusConfig: Record<
  TransformationStatus,
  { label: string; color: string }
> = {
  PENDING: { label: "En attente", color: "yellow" },
  PREVIEWED: { label: "Prévisualisé", color: "blue" },
  APPLIED: { label: "Appliqué", color: "green" },
  CANCELLED: { label: "Annulé", color: "gray" },
  FAILED: { label: "Échec", color: "red" },
};

export default function TransformationStatusBadge({ status }: Props) {
  if (!status) {
    return (
      <Badge variant="light" color="gray" radius="sm">
        Aucun preview
      </Badge>
    );
  }

  const config = statusConfig[status];

  return (
    <Badge variant="light" color={config.color} radius="sm">
      {config.label}
    </Badge>
  );
}

