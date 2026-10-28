import { TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "next-i18next";
import { AppButton } from "../../ui";

interface Props {
  submitAction: (value: String) => void;
  error: String;
  cancel: () => void;
}

export default function RoleForm({ submitAction, error, cancel }: Props) {
  const { t } = useTranslation("common");

  const form = useForm({
    initialValues: { roleName: "" },
    validate: {
      roleName: (value) =>
        /^[a-zA-Z]+$/.test(value) ? null : "Role name must contain only letters",
    },
  });

  return (
    <form onSubmit={form.onSubmit((data) => submitAction(data.roleName))}>
      <TextInput
        required
        placeholder="Role name"
        radius="md"
        value={form.values.roleName}
        onChange={(e) => form.setFieldValue("roleName", e.currentTarget.value)}
        error={form.errors.roleName || error}
        mb="md"
      />
      <AppButton type="submit" fullWidth>
        {t("create")}
      </AppButton>
      <AppButton intent="ghost" type="reset" fullWidth mt="sm" onClick={cancel}>
        {t("cancel")}
      </AppButton>
    </form>
  );
}
