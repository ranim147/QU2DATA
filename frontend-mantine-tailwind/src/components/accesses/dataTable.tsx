import { Switch } from "@mantine/core";
import { useTranslation } from "next-i18next";
import { useToggle } from "@mantine/hooks";
import { GetPermissionsDataForRole } from "../permissions/query";
import {
  ApolloQueryResult,
  OperationVariables,
  useMutation,
  useQuery,
} from "@apollo/client";
import { GET_PERMISSIONS_FOR_ROLE } from "../permissions/query";
import AffectPermission from "../permissions/affectPermission";
import { useState } from "react";
import { Role } from "../../types/role.types";
import ConfirmComponent from "../../layout/confirmComponent";
import { SAVE_ACCESS_MUTATION, UPDATE_ACCESS_MUTATION } from "./mutation";
import { GET_ROLE_STATISTICS } from "../roles/types";
import { hasPermission } from "../../layout/dashboardLayout/sidebar/sidebarLink";
import { useAuthContext } from "../../context/AuthContext";
import { AppButton, AppTable, Card } from "../../ui";

interface Props {
  selectedRole: Role;
  refetchStatistics: (
    variables?: Partial<OperationVariables>
  ) => Promise<ApolloQueryResult<GET_ROLE_STATISTICS>>;
}

export default function DataTable({ selectedRole, refetchStatistics }: Props) {
  const { t } = useTranslation("rolesManagements");
  const { user } = useAuthContext();
  const accessesData = selectedRole?.accesses;

  const [openSelectPermissions, toggleSelectPermissions] = useToggle([false, true]);
  const [openConfirm, toggleOpenConfirm] = useToggle([false, true]);
  const [saveAccess] = useMutation(SAVE_ACCESS_MUTATION);
  const [updateAccessMutation] = useMutation(UPDATE_ACCESS_MUTATION);

  const { data, loading, refetch } = useQuery<GetPermissionsDataForRole>(
    GET_PERMISSIONS_FOR_ROLE,
    { variables: { roleId: selectedRole?.id } }
  );

  const [affectationData, setAffectationData] = useState({
    roleId: null,
    permissionId: null,
  });

  const updateAccess = async (value: boolean, accessType: string, id: string) => {
    const { data } = await updateAccessMutation({
      variables: { value, accessType, accessId: id },
    });
    if (data?.updateAccess?.success) refetchStatistics();
  };

  const confirmAffectation = (value: string) => {
    setAffectationData({ roleId: selectedRole?.id, permissionId: value });
    toggleOpenConfirm();
  };

  const saveAffectation = async () => {
    const { data } = await saveAccess({
      variables: {
        permissionId: affectationData.permissionId,
        roleId: affectationData.roleId,
      },
    });
    if (data?.saveAccess?.success) {
      toggleOpenConfirm();
      setAffectationData({ roleId: null, permissionId: null });
      toggleSelectPermissions();
      refetchStatistics();
    }
  };

  const canUpdate = hasPermission("roles", "can_update", user);

  return (
    <>
      <ConfirmComponent
        opened={openConfirm}
        title={t("permissions.confirm.affect.title")}
        description={t("permissions.confirm.affect.description", {
          role: selectedRole?.roleName,
        })}
        confirmAction={saveAffectation}
        onClose={toggleOpenConfirm}
        customConfirmProps={{ buttonColor: "brand", buttonLabel: t("common:save") }}
      />

      <div className="mb-4">
        {openSelectPermissions ? (
          <AffectPermission
            data={data?.getPermissionsDataForRole}
            loading={loading}
            cancel={() => {
              setAffectationData({ roleId: null, permissionId: null });
              toggleSelectPermissions();
            }}
            save={confirmAffectation}
          />
        ) : (
          <AppButton
            loading={loading}
            onClick={toggleSelectPermissions}
            disabled={data?.getPermissionsDataForRole?.length === 0}
          >
            {t("permissions.affect")}
          </AppButton>
        )}
      </div>

      <Card padding={false}>
        <AppTable>
          <thead>
            <tr>
              <th>{t("permissions.name")}</th>
              <th>{t("permissions.flag")}</th>
              <th>{t("access.can_create")}</th>
              <th>{t("access.can_update")}</th>
              <th>{t("access.can_delete")}</th>
              <th>{t("access.can_show")}</th>
              <th>{t("access.can_show_own")}</th>
              <th>{t("access.isFullAccess")}</th>
            </tr>
          </thead>
          <tbody>
            {accessesData?.map((value, key) => (
              <tr key={key}>
                <td style={{ fontWeight: 500 }}>{value.Permission.name}</td>
                <td>
                  <span style={{
                    display: "inline-flex",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    backgroundColor: "#f0fdf4",
                    color: "#166534",
                  }}>
                    {value.Permission.flag}
                  </span>
                </td>
                {(["can_create", "can_update", "can_delete", "can_show", "can_show_own"] as const).map(
                  (field) => (
                    <td key={field}>
                      <Switch
                        size="sm"
                        onLabel="ON"
                        offLabel="OFF"
                        disabled={!canUpdate || value.isFullAccess}
                        checked={value.isFullAccess ? true : value[field]}
                        onChange={(e) => updateAccess(e.target.checked, field, value.id)}
                      />
                    </td>
                  )
                )}
                <td>
                  <Switch
                    size="sm"
                    onLabel="ON"
                    offLabel="OFF"
                    disabled={!canUpdate}
                    checked={value.isFullAccess}
                    onChange={(e) => updateAccess(e.target.checked, "isFullAccess", value.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </AppTable>
      </Card>
    </>
  );
}
