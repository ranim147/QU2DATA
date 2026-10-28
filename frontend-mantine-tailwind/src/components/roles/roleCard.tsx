import { ActionIcon, LoadingOverlay, Select, Skeleton } from "@mantine/core";
import { Role, RoleStatistics } from "../../types/role.types";
import { Dispatch, SetStateAction, useState } from "react";
import { useTranslation } from "next-i18next";
import { IconPlus } from "@tabler/icons-react";
import { useToggle } from "@mantine/hooks";
import RoleForm from "./roleForm";
import { ApolloQueryResult, OperationVariables, useMutation } from "@apollo/client";
import { GetRolesData } from "./types";
import { ADD_ROLE_MUTATION, DELETE_ROLE_MUTATION } from "./mutation";
import { hasPermission } from "../../layout/dashboardLayout/sidebar/sidebarLink";
import { useAuthContext } from "../../context/AuthContext";
import ConfirmComponent from "../../layout/confirmComponent";
import { AppButton, Card } from "../../ui";

interface Props {
  loading: boolean;
  selectedRole: Role;
  setSelectedRole: Dispatch<SetStateAction<Role>>;
  data: Role[];
  loadingStatistics: boolean;
  statisticsData: RoleStatistics;
  refetchRoles: (
    variables?: Partial<OperationVariables>
  ) => Promise<ApolloQueryResult<GetRolesData>>;
}

export default function RoleCard({
  loading,
  selectedRole,
  setSelectedRole,
  data,
  loadingStatistics,
  statisticsData,
  refetchRoles,
}: Props) {
  const { t } = useTranslation("rolesManagements");
  const { user } = useAuthContext();
  const [createForm, toggleCreateForm] = useToggle([false, true]);
  const [error, setError] = useState(null);
  const [openConfirmDelete, toggleOpenConfirmDelete] = useToggle([false, true]);
  const [addRole] = useMutation(ADD_ROLE_MUTATION);
  const [deleteRole] = useMutation(DELETE_ROLE_MUTATION);

  const handleChange = (value: string) => {
    setSelectedRole(data.find((r) => r.id === value));
  };

  const handleSubmit = (value: String) => {
    addRole({ variables: { roleName: value } })
      .then(({ data }) => {
        if (data.createRole.success) {
          refetchRoles();
          toggleCreateForm();
          setError(null);
        }
      })
      .catch(() => setError(t("errors.role_already_exist")));
  };

  const handleDeleteRole = () => {
    deleteRole({ variables: { roleId: selectedRole?.id } }).then(({ data }) => {
      if (data.deleteRole.success) {
        refetchRoles();
        toggleOpenConfirmDelete();
      }
    });
  };

  return (
    <Card>
      <ConfirmComponent
        confirmAction={handleDeleteRole}
        title={t("confirm.delete.title")}
        description={t("confirm.delete.description")}
        onClose={toggleOpenConfirmDelete}
        opened={openConfirmDelete}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
          Role
        </span>
        {hasPermission("roles", "can_create", user) && (
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={toggleCreateForm}
            sx={{ "&:hover": { backgroundColor: "#f0fdf4", color: "#84BF43" } }}
          >
            <IconPlus size={14} />
          </ActionIcon>
        )}
      </div>

      {createForm ? (
        <RoleForm submitAction={handleSubmit} error={error} cancel={handleCancel} />
      ) : (
        <>
          {loading ? (
            <LoadingOverlay visible />
          ) : (
            <Select
              value={selectedRole.id}
              dropdownPosition="bottom"
              placeholder={t("common:select")}
              radius="md"
              data={data.map((d) => ({ value: d.id, label: d.roleName }))}
              onChange={handleChange}
            />
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 my-5">
            {loadingStatistics ? (
              <>
                <Skeleton height={60} radius="md" />
                <Skeleton height={60} radius="md" />
              </>
            ) : (
              <>
                <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                  <p className="text-2xl font-bold text-gray-900">
                    {statisticsData?.userCount ?? "—"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{t("number_of_users")}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                  <p className="text-2xl font-bold text-gray-900">
                    {statisticsData?.accessesCount ?? "—"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{t("number_of_accesses")}</p>
                </div>
              </>
            )}
          </div>

          <AppButton intent="danger" fullWidth onClick={toggleOpenConfirmDelete}>
            {t("common:delete")}
          </AppButton>
        </>
      )}
    </Card>
  );

  function handleCancel() {
    refetchRoles();
    toggleCreateForm();
    setError(null);
  }
}
