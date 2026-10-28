import { useDisclosure } from "@mantine/hooks";
import Users from "../../src/components/users";
import { withTranslations } from "../../src/helpers/HOC/withTranslations";
import DashboardLayout from "../../src/layout/dashboardLayout";
import { LoadingOverlay } from "@mantine/core";
import UserForm from "../../src/components/users/userForm";
import { useUsers } from "../../src/components/users/hooks";
import { useState } from "react";
import { PaginationComponent } from "../../src/layout/pagination";
import { PaginationOptions } from "../../src/layout/types";
import { useAuthContext } from "../../src/context/AuthContext";
import { User } from "../../src/types/user.type";
import { AppModal } from "../../src/ui";

export default function UserPage() {
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedUser, setSelectedUser] = useState<User>(null);
  const { user } = useAuthContext();
  const [paginationOptions, setPaginationOptions] = useState<PaginationOptions>({
    page: 1,
    limit: 5,
  });
  const [search, setSearch] = useState("");
  const { users, refetch, loading, data_count } = useUsers(search, paginationOptions);

  const handleDone = () => {
    close();
    refetch();
    setSelectedUser(null);
  };

  const openEdit = (u: User) => {
    setSelectedUser(u);
    open();
  };

  return (
    <DashboardLayout>
      {user ? (
        <>
          <AppModal
            opened={opened}
            onClose={close}
            title={selectedUser ? "Edit User" : "Add New User"}
          >
            <UserForm notifyParent={handleDone} user={selectedUser} />
          </AppModal>

          <Users
            open={open}
            users={users}
            refetch={refetch}
            loading={loading}
            openEdit={openEdit}
            search={search}
            setSearch={setSearch}
          />

          <PaginationComponent
            data_count={data_count}
            paginationOptions={paginationOptions}
            setPaginationOptions={setPaginationOptions}
          />
        </>
      ) : (
        <LoadingOverlay visible />
      )}
    </DashboardLayout>
  );
}

export const getStaticProps = withTranslations(undefined, [
  "sidebar",
  "usersManagement",
]);
