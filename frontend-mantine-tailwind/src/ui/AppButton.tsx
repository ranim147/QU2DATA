import { Button, ButtonProps } from "@mantine/core";
import { ReactNode } from "react";

type Intent = "primary" | "danger" | "ghost";

interface AppButtonProps extends Omit<ButtonProps, "color" | "variant"> {
  intent?: Intent;
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const intentStyles: Record<Intent, object> = {
  primary: {},
  danger: {
    root: {
      backgroundColor: "#ef4444",
      color: "#fff",
      border: "2px solid #ef4444",
      "&:hover": { backgroundColor: "#dc2626", borderColor: "#dc2626" },
    },
  },
  ghost: {
    root: {
      backgroundColor: "#fff",
      color: "#000",
      border: "2px solid #000",
      "&:hover": { backgroundColor: "#f5f5f5" },
    },
  },
};

const intentMantineProps: Record<Intent, Partial<ButtonProps>> = {
  primary: {},
  danger: { color: "red" },
  ghost: { color: "dark", variant: "outline" },
};

export function AppButton({
  intent = "primary",
  children,
  ...rest
}: AppButtonProps) {
  return (
    <Button
      radius="md"
      {...intentMantineProps[intent]}
      styles={() => intentStyles[intent]}
      {...rest}
    >
      {children}
    </Button>
  );
}
