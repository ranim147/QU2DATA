import { TextInput } from "@mantine/core";
import { useTranslation } from "next-i18next";
import { useForm } from "@mantine/form";
import { IconSearch } from "@tabler/icons-react";
import DataTable from "./dataTable";
import { GetUsersData } from "./types";
import { ApolloQueryResult, OperationVariables } from "@apollo/client";
import { Dispatch, SetStateAction } from "react";
import { hasPermission } from "../../layout/dashboardLayout/sidebar/sidebarLink";
import { useAuthContext } from "../../context/AuthContext";
import { User } from "../../types/user.type";
import { AppButton, Card, PageHeader } from "../../ui";

interface Props {
  open: () => void;
  refetch: (variables?: Partial<OperationVariables>) => Promise<ApolloQueryResult<GetUsersData>>;
  loading: boolean;
  users: User[];
  openEdit: (user: User) => void;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
}

export default function Users(props: Props) {
  const { open, refetch, loading, users, openEdit, search, setSearch } = props;
  const { user } = useAuthContext();
  const { t } = useTranslation("usersManagement");

  const searchForm = useForm({ initialValues: { search } });

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") setSearch(searchForm.values.search);
  };

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage platform accounts"
        action={
          hasPermission("users", "can_create", user) ? (
            <AppButton onClick={open}>{t("actions.create")}</AppButton>
          ) : undefined
        }
      />

      <Card padding={false}>
        <div className="px-4 py-3 border-b border-gray-100">
          <TextInput
            rightSection={
              <IconSearch
                size={15}
                style={{ cursor: "pointer", color: "#9ca3af" }}
                onClick={() => setSearch(searchForm.values.search)}
              />
            }
            placeholder="Search users…"
            radius="md"
            className="w-72"
            onKeyDown={handleKeyDown}
            {...searchForm.getInputProps("search")}
          />
        </div>
        <DataTable
          users={users}
          refetch={refetch}
          loading={loading}
          openEdit={openEdit}
        />
      </Card>
    </div>
  );
}
