import { Badge } from "@mantine/core";

interface StatusBadgeProps {
  active: boolean;
  labels?: [string, string];
  inactiveColor?: string;
}

export function StatusBadge({
  active,
  labels = ["Active", "Inactive"],
  inactiveColor = "gray",
}: StatusBadgeProps) {
  return (
    <Badge
      variant="light"
      color={active ? "brand" : inactiveColor}
      size="sm"
      radius="sm"
    >
      {active ? labels[0] : labels[1]}
    </Badge>
  );
}
