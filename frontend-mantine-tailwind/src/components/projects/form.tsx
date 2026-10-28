import { Dispatch, SetStateAction } from "react";
import { useTranslation } from "next-i18next";
import {
  TextInput,
  Textarea,
  Chip,
  Group,
  Stack,
  Button,
  CloseButton,
  Text,
  Badge,
} from "@mantine/core";
import { OBJECTIVE_OPTIONS, ProjectFormValues, InviteEntry } from "./types";

interface StepOneProps {
  values: ProjectFormValues;
  setValues: Dispatch<SetStateAction<ProjectFormValues>>;
}

export function StepOne({ values, setValues }: StepOneProps) {
  const { t } = useTranslation("projects");

  return (
    <Stack spacing="md" mt="md">
      <TextInput
        label={t("name_label")}
        placeholder={t("name_placeholder")}
        required
        autoFocus
        value={values.name}
        onChange={(e) => setValues({ ...values, name: e.currentTarget.value })}
      />
      <Textarea
        label={t("description_label")}
        placeholder={t("description_placeholder")}
        minRows={3}
        value={values.description}
        onChange={(e) =>
          setValues({ ...values, description: e.currentTarget.value })
        }
      />
    </Stack>
  );
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface StepTwoProps {
  values: ProjectFormValues;
  setValues: Dispatch<SetStateAction<ProjectFormValues>>;
  emailInput: string;
  setEmailInput: Dispatch<SetStateAction<string>>;
  emailError: string;
  setEmailError: Dispatch<SetStateAction<string>>;
}

export function StepTwo({
  values,
  setValues,
  emailInput,
  setEmailInput,
  emailError,
  setEmailError,
}: StepTwoProps) {
  const { t } = useTranslation("projects");

  function addInvite() {
    const email = emailInput.trim();
    if (!email) return;
    if (!EMAIL_REGEX.test(email)) {
      setEmailError(t("invite_invalid_email"));
      return;
    }
    if (values.invites.some((i) => i.email === email)) {
      setEmailError(t("invite_already_added"));
      return;
    }
    const next: InviteEntry = { email };
    setValues({ ...values, invites: [...values.invites, next] });
    setEmailInput("");
    setEmailError("");
  }

  function removeInvite(email: string) {
    setValues({
      ...values,
      invites: values.invites.filter((i) => i.email !== email),
    });
  }

  return (
    <Stack spacing="md" mt="md">
      <Text size="xs" color="dimmed">
        {t("step2_optional_hint")}
      </Text>

      <TextInput
        label={t("domain_label")}
        description={t("domain_hint")}
        placeholder={t("domain_placeholder")}
        value={values.domain}
        onChange={(e) => setValues({ ...values, domain: e.currentTarget.value })}
      />

      <div>
        <Text size="sm" weight={600} mb={6}>
          {t("objective_label")}
        </Text>
        <Chip.Group
          multiple={false}
          value={values.objective ?? ""}
          onChange={(val) =>
            setValues({ ...values, objective: val === values.objective ? null : val })
          }
        >
          <Group spacing="xs">
            {OBJECTIVE_OPTIONS.map((opt) => (
              <Chip key={opt.value} value={opt.value} radius="md">
                {t(opt.labelKey)}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      </div>

      <div>
        <Text size="sm" weight={600} mb={6}>
          {t("invite_label")}
        </Text>
        <Group spacing="xs" align="flex-start">
          <TextInput
            style={{ flex: 1 }}
            placeholder={t("invite_placeholder")}
            value={emailInput}
            error={emailError || undefined}
            onChange={(e) => {
              setEmailInput(e.currentTarget.value);
              if (emailError) setEmailError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addInvite();
              }
            }}
          />
          <Button variant="default" onClick={addInvite}>
            {t("invite_add")}
          </Button>
        </Group>
        <Text size="xs" color="dimmed" mt={6}>
          {t("invite_hint")}
        </Text>

        {values.invites.length > 0 && (
          <Stack spacing={6} mt="sm">
            {values.invites.map((inv) => (
              <Group key={inv.email} position="apart" noWrap>
                <Badge
                  variant="light"
                  color="brand"
                  size="lg"
                  radius="sm"
                  styles={{ root: { textTransform: "none", fontWeight: 500 } }}
                >
                  {inv.email}
                </Badge>
                <CloseButton
                  size="sm"
                  onClick={() => removeInvite(inv.email)}
                  aria-label={t("invite_remove")}
                />
              </Group>
            ))}
          </Stack>
        )}
      </div>
    </Stack>
  );
}