import { Switch } from "@mantine/core";
import { useTranslation } from "next-i18next";
import { useMutation, ApolloQueryResult } from "@apollo/client";
import { DELETE_USER_BY_ADMIN, UPDATE_USER_ATTRIBUTE } from "./mutations";
import { GetUsersData } from "./types";
import LineLoader from "../../layout/rowTableLoader";
import ConfirmComponent from "../../layout/confirmComponent";
import { useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { hasPermission } from "../../layout/dashboardLayout/sidebar/sidebarLink";
import { User } from "../../types/user.type";
import { AppActionIcon, AppTable } from "../../ui";

interface Props {
  users: User[];
  refetch: () => Promise<ApolloQueryResult<GetUsersData>>;
  loading: Boolean;
  openEdit: (user: User) => void;
}

export default function DataTable({ users, refetch, loading, openEdit }: Props) {
  const { user: connectedUser } = useAuthContext();
  const { t } = useTranslation("usersManagement");
  const [updateUserAttribute] = useMutation(UPDATE_USER_ATTRIBUTE);
  const [deleteUserByAdmin] = useMutation(DELETE_USER_BY_ADMIN);
  const [userToDelete, setUserToDelete] = useState<User>(null);

  const deleteUser = async () => {
    await deleteUserByAdmin({ variables: { userId: userToDelete.id } });
    setUserToDelete(null);
    refetch();
  };

  const changeChecked = async (userId: string, state: boolean, attribute: string) => {
    await updateUserAttribute({
      variables: { userId, attribute, value: state.toString(), typeAttribute: "BOOLEAN" },
    });
    refetch();
  };

  const canUpdate = hasPermission("users", "can_update", connectedUser);
  const canDelete = hasPermission("users", "can_delete", connectedUser);

  return (
    <>
      <ConfirmComponent
        confirmAction={deleteUser}
        onClose={() => setUserToDelete(null)}
        description={t("confirm.delete.description")}
        title={t("confirm.delete.title")}
        opened={userToDelete !== null}
      />

      <AppTable>
        <thead>
          <tr>
            <th>{t("email")}</th>
            <th>{t("user_name")}</th>
            <th>{t("lastLogin")}</th>
            <th>{t("role")}</th>
            <th>{t("isActive")}</th>
            <th>{t("isBanned")}</th>
            {(canUpdate || canDelete) && <th colSpan={2}>{t("actions.title")}</th>}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <LineLoader lineHeight={10} colLength={7} rowLength={6} />
          ) : (
            users.map((user, key) => (
              <tr key={key}>
                <td style={{ fontWeight: 500, color: "#111827" }}>{user.email}</td>
                <td>{user.user_name}</td>
                <td style={{ color: "#9ca3af", fontSize: 12 }}>
                  {new Date(Number(user.lastLogin)).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    backgroundColor: "#f3f4f6",
                    color: "#374151",
                  }}>
                    {user.Role.roleName}
                  </span>
                </td>
                <td>
                  <Switch
                    size="sm"
                    checked={user.isActive}
                    onChange={(e) => changeChecked(user.id, e.currentTarget.checked, "isActive")}
                    disabled={!canUpdate}
                  />
                </td>
                <td>
                  <Switch
                    size="sm"
                    checked={user.isBanned}
                    onChange={(e) => changeChecked(user.id, e.currentTarget.checked, "isBanned")}
                    disabled={!canUpdate}
                  />
                </td>
                <td>
                  {canUpdate && (
                    <AppActionIcon intent="edit" onClick={() => openEdit(user)} tooltip={t("actions.edit")} />
                  )}
                </td>
                <td>
                  {canDelete && (
                    <AppActionIcon intent="delete" onClick={() => setUserToDelete(user)} />
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </AppTable>
    </>
  );
}
