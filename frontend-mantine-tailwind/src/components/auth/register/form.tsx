import { useTranslation } from "next-i18next";
import { Button, Group, PasswordInput, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMutation } from "@apollo/client";
import { RegisterMutation } from "./mutations";
import { UserRegisterResponse } from "./types";
import { useAuthContext } from "../../../context/AuthContext";
import { useRouter } from "next/router";

const inputStyles = {
  input: {
    borderColor: "#e5e7eb",
    "&:focus": { borderColor: "#84BF43" },
  },
  label: { color: "#374151", fontWeight: 500 },
};

export default function RegisterForm() {
  const { t } = useTranslation("singUp");
  const [register, { loading }] =
    useMutation<UserRegisterResponse>(RegisterMutation);
  const router = useRouter();
  const { handleLoginData } = useAuthContext();

  const form = useForm({
    initialValues: { email: "", password: "", confirmPassword: "" },
    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : "Invalid email"),
      password: (val) =>
        val.length <= 6 ? "Password should include at least 6 characters" : null,
      confirmPassword: (val, values) =>
        val !== values.password ? t("passwords_do_not_match") : null,
    },
  });

  function handleSubmit(model: typeof form.values) {
    const email = model.email.replace(/\s/g, "");
    register({ variables: { email, password: model.password } })
      .then(({ data }) => {
        const { createUser } = data;
        if (!createUser.success) {
          form.setErrors({
            email:
              createUser.message === "EMAIL ALREADY EXISTS"
                ? t("email_already_exists")
                : t("common:ops_error"),
          });
        } else {
          handleLoginData({
            token: createUser.token,
            refreshToken: createUser.refreshToken,
            user: createUser.user,
          });
          router.push("/validation");
        }
      })
      .catch(() => {
        form.setErrors({ email: t("common:ops_error") });
      });
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput
          required
          label={t("email")}
          placeholder={t("email")}
          value={form.values.email}
          onChange={(e) => form.setFieldValue("email", e.currentTarget.value)}
          error={form.errors.email}
          radius="md"
          styles={inputStyles}
        />
        <PasswordInput
          required
          label={t("password")}
          placeholder={t("password")}
          value={form.values.password}
          onChange={(e) => form.setFieldValue("password", e.currentTarget.value)}
          error={form.errors.password}
          radius="md"
          styles={inputStyles}
        />
        <PasswordInput
          required
          label={t("confirm_password")}
          placeholder={t("confirm_password")}
          value={form.values.confirmPassword}
          onChange={(e) =>
            form.setFieldValue("confirmPassword", e.currentTarget.value)
          }
          error={form.errors.confirmPassword}
          radius="md"
          styles={inputStyles}
        />
        <Group position="center" mt="xl">
          <Button type="submit" loading={loading} fullWidth>
            {t("sing_up_button")}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
