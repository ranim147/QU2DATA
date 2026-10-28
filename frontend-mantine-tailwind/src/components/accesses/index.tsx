import { LoadingOverlay } from "@mantine/core";
import { Access } from "../../types/access.types";
import DataTable from "./dataTable";
import { Role } from "../../types/role.types";
import { ApolloQueryResult, OperationVariables } from "@apollo/client";
import { GET_ROLE_STATISTICS, GetRolesData } from "../roles/types";
import { Dispatch, SetStateAction } from "react";
interface Props {
  loading: boolean;
  selectedRole: Role;
  refetchStatistics: (
    variables?: Partial<OperationVariables>
  ) => Promise<ApolloQueryResult<GET_ROLE_STATISTICS>>;
}
export default function Accesses(props: Props) {
  const { loading, selectedRole, refetchStatistics } = props;
  return loading ? (
    <LoadingOverlay visible />
  ) : (
    <DataTable
      selectedRole={selectedRole}
      refetchStatistics={refetchStatistics}
    />
  );
}
