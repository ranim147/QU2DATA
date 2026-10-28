import { Table, TableProps } from "@mantine/core";
import { ReactNode } from "react";

interface AppTableProps extends TableProps {
  children: ReactNode;
}

export function AppTable({ children, ...rest }: AppTableProps) {
  return (
    <Table
      verticalSpacing="md"
      horizontalSpacing="lg"
      fontSize="sm"
      {...rest}
      sx={{
        "& thead tr th": {
          backgroundColor: "#f9fafb",
          color: "#6b7280",
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          borderBottom: "1px solid #e5e7eb",
          whiteSpace: "nowrap",
        },
        "& tbody tr td": {
          color: "#374151",
          borderBottom: "1px solid #f3f4f6",
          verticalAlign: "middle",
        },
        "& tbody tr:last-child td": {
          borderBottom: "none",
        },
        "& tbody tr:hover td": {
          backgroundColor: "#fafff4",
        },
        ...(typeof rest.sx === "object" ? rest.sx : {}),
      }}
    >
      {children}
    </Table>
  );
}
