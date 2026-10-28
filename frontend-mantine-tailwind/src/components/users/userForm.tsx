import { useMutation, useQuery } from "@apollo/client";
import { QUERY_GET_ROLES } from "../roles/queries";
import { GetRolesData } from "../roles/types";
import { useForm } from "@mantine/form";
import { LoadingOverlay, PasswordInput, Select, Stack, TextInput } from "@mantine/core";
import { useTranslation } from "next-i18next";
import { CREATE_USER_BY_ADMIN, UPDATE_USER_BY_ADMIN } from "./mutations";
import { CreateUserByAdminResponse, UpdateUserByAdminResponse } from "./types";
import { User } from "../../types/user.type";
import { AppButton } from "../../ui";

interface Props {
  notifyParent: () => void;
  user: User;
}

export default function UserForm({ notifyParent, user }: Props) {
  const { loading, data } = useQuery<GetRolesData>(QUERY_GET_ROLES);
  const { t } = useTranslation("usersManagement");
  const action = user ? "edit" : "create";

  const [createUserByAdmin] = useMutation<CreateUserByAdminResponse>(CREATE_USER_BY_ADMIN);
  const [updateUserByAdmin] = useMutation<UpdateUserByAdminResponse>(UPDATE_USER_BY_ADMIN);

  const form = useForm({
    initialValues: {
      email: user?.email ?? "",
      password: "",
      roleId: user?.Role?.id ?? "",
    },
    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : "Invalid email"),
      password: (val) =>
        action === "create" && val.length <= 6
          ? "Password must be at least 7 characters"
          : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    const { email, password, roleId } = values;
    if (action === "create") {
      const { data } = await createUserByAdmin({ variables: { email, password, roleId } });
      if (data?.createUserByAdmin?.success) notifyParent();
    } else {
      const { data } = await updateUserByAdmin({
        variables: { email, password, roleId, userId: user.id },
      });
      if (data?.updateUserByAdmin?.success) notifyParent();
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack spacing="md">
        <TextInput
          required
          label={t("email")}
          radius="md"
          value={form.values.email}
          onChange={(e) => form.setFieldValue("email", e.currentTarget.value)}
          error={form.errors.email}
        />
        <PasswordInput
          required={action === "create"}
          label={action === "edit" ? "New password (leave blank to keep)" : "Password"}
          radius="md"
          value={form.values.password}
          onChange={(e) => form.setFieldValue("password", e.currentTarget.value)}
          error={form.errors.password}
        />
        {loading ? (
          <LoadingOverlay visible />
        ) : (
          <Select
            withAsterisk
            withinPortal
            label={t("role")}
            placeholder="Select a role"
            radius="md"
            dropdownPosition="bottom"
            value={form.values.roleId}
            data={data?.getRoles.map((r) => ({ value: r.id, label: r.roleName })) ?? []}
            onChange={(v) => form.setFieldValue("roleId", v)}
          />
        )}
      </Stack>
      <div className="flex justify-end mt-6">
        <AppButton type="submit">{t(`actions.${action}`)}</AppButton>
      </div>
    </form>
  );
}
