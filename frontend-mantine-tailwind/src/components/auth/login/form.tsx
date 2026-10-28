import { useTranslation } from "next-i18next";
import { Button, Group, PasswordInput, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMutation } from "@apollo/client";
import { LoginMutation } from "./mutations";
import { UserLoginResponse } from "./types";
import { useAuthContext } from "../../../context/AuthContext";
import { useRouter } from "next/router";

export default function LoginForm() {
  const { t } = useTranslation("login");
  const [login, { loading }] = useMutation<UserLoginResponse>(LoginMutation);
  const router = useRouter();
  const { handleLoginData } = useAuthContext();

  const form = useForm({
    initialValues: { email: "", password: "" },
    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : "Invalid email"),
      password: (val) =>
        val.length <= 6 ? "Password should include at least 6 characters" : null,
    },
  });

  function handleSubmit(model: typeof form.values) {
    const email = model.email.replace(/\s/g, "");
    login({ variables: { email, password: model.password } })
      .then(({ data }) => {
        const { Login } = data;
        if (!Login.success) {
          form.setErrors({
            password:
              Login.message === "BAD CREDENTIALS"
                ? t("common:bad_credentials")
                : t("common:ops_error"),
          });
        } else {
          handleLoginData({
            token: Login.token,
            refreshToken: Login.refreshToken,
            user: Login.user,
          });
          if (Login.user?.isActive === false) {
            router.push("/validation");
          } else {
            router.reload();
          }
        }
      })
      .catch(() => {
        form.setErrors({ password: t("common:ops_error") });
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
          styles={{
            input: {
              borderColor: "#e5e7eb",
              "&:focus": { borderColor: "#84BF43" },
            },
            label: { color: "#374151", fontWeight: 500 },
          }}
        />
        <PasswordInput
          required
          label={t("password")}
          placeholder={t("password")}
          value={form.values.password}
          onChange={(e) => form.setFieldValue("password", e.currentTarget.value)}
          error={form.errors.password}
          radius="md"
          styles={{
            input: {
              borderColor: "#e5e7eb",
              "&:focus": { borderColor: "#84BF43" },
            },
            label: { color: "#374151", fontWeight: 500 },
          }}
        />
        <Group position="center" mt="xl">
          <Button type="submit" loading={loading} fullWidth>
            {t("login")}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
