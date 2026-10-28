import { ActionIcon, Tooltip } from "@mantine/core";
import { IconPencil, IconTrash } from "@tabler/icons-react";

type ActionIntent = "edit" | "delete";

interface AppActionIconProps {
  intent: ActionIntent;
  onClick: () => void;
  tooltip?: string;
  disabled?: boolean;
}

const config: Record<
  ActionIntent,
  { icon: typeof IconPencil; hoverColor: string; defaultTooltip: string }
> = {
  edit: {
    icon: IconPencil,
    hoverColor: "#f0fdf4",
    defaultTooltip: "Edit",
  },
  delete: {
    icon: IconTrash,
    hoverColor: "#fef2f2",
    defaultTooltip: "Delete",
  },
};

export function AppActionIcon({
  intent,
  onClick,
  tooltip,
  disabled = false,
}: AppActionIconProps) {
  const { icon: Icon, hoverColor, defaultTooltip } = config[intent];
  const label = tooltip ?? defaultTooltip;

  return (
    <Tooltip label={label} withArrow position="top">
      <ActionIcon
        variant="subtle"
        onClick={onClick}
        disabled={disabled}
        sx={{
          color: "#9ca3af",
          "&:hover": {
            backgroundColor: hoverColor,
            color: intent === "delete" ? "#ef4444" : "#84BF43",
          },
          "&[data-disabled]": { opacity: 0.3, pointerEvents: "none" },
        }}
      >
        <Icon size={16} stroke={1.5} />
      </ActionIcon>
    </Tooltip>
  );
}
