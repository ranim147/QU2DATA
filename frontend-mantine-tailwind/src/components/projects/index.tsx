import { useState } from "react";
import { useTranslation } from "next-i18next";
import { useMutation } from "@apollo/client";
import {
  Modal,
  Stepper,
  Group,
  Button,
  UnstyledButton,
  Text,
  ThemeIcon,
  LoadingOverlay,
  Stack,
} from "@mantine/core";
import { StepOne, StepTwo } from "./form";
import {
  CREATE_PROJECT_MUTATION,
  CreateProjectType,
  INVITE_COLLABORATOR_MUTATION,
  InviteCollaboratorType,
} from "./mutation";
import { ProjectFormValues, INITIAL_PROJECT_FORM_VALUES } from "./types";

interface Props {
  refetchProjects?: () => void;
}

export default function Projects(props: Props) {
  const { refetchProjects } = props;
  const { t } = useTranslation("projects");

  const [opened, setOpened] = useState(false);
  const [active, setActive] = useState(0);
  const [values, setValues] = useState<ProjectFormValues>(
    INITIAL_PROJECT_FORM_VALUES
  );
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [created, setCreated] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [createProjectMutation, { loading: creating }] =
    useMutation<CreateProjectType>(CREATE_PROJECT_MUTATION);
  const [inviteCollaboratorMutation, { loading: inviting }] =
    useMutation<InviteCollaboratorType>(INVITE_COLLABORATOR_MUTATION);

  const loading = creating || inviting;

  function resetAll() {
    setActive(0);
    setValues(INITIAL_PROJECT_FORM_VALUES);
    setEmailInput("");
    setEmailError("");
    setCreated(false);
    setSubmitError("");
  }

  function closeModal() {
    setOpened(false);
    setTimeout(resetAll, 200);
  }

  async function submit() {
    setSubmitError("");
    try {
      const { data } = await createProjectMutation({
        variables: {
          name: values.name,
          description: values.description || undefined,
          domain: values.domain || undefined,
          objective: values.objective || undefined,
        },
      });

      if (!data?.createProject.success || !data.createProject.project) {
        setSubmitError(data?.createProject.message || t("error_generic"));
        return;
      }

      const projectId = data.createProject.project.id;

      // Une invitation par email, en parallèle
      if (values.invites.length > 0) {
        await Promise.all(
          values.invites.map((invite) =>
            inviteCollaboratorMutation({
              variables: {
                projectId,
                email: invite.email,
                isOwner: false,
              },
            }).catch(() => null) // une invitation ratée ne bloque pas les autres
          )
        );
      }

      setCreated(true);
      refetchProjects?.();
      setTimeout(closeModal, 1400);
    } catch (err) {
      setSubmitError(t("error_generic"));
    }
  }

  const canContinue = values.name.trim().length > 0;

  return (
    <>
      <UnstyledButton
        onClick={() => setOpened(true)}
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          gap: theme.spacing.sm,
          padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
          borderRadius: theme.radius.md,
          border: `1px solid ${theme.colors.gray[3]}`,
          transition: "border-color 120ms ease",
          "&:hover": { borderColor: theme.colors.brand[5] },
        })}
      >
        <ThemeIcon color="brand" variant="light" size={36} radius="md">
          +
        </ThemeIcon>
        <div>
          <Text size={11} weight={700} color="brand" tt="uppercase">
            {t("trigger_eyebrow")}
          </Text>
          <Text size="sm" weight={600}>
            {t("trigger_label")}
          </Text>
        </div>
      </UnstyledButton>

      <Modal
        opened={opened}
        onClose={closeModal}
        title={
          <Text weight={700} size="lg">
            {created
              ? t("success_title", { name: values.name })
              : active === 0
              ? t("modal_title_step1")
              : t("modal_title_step2")}
          </Text>
        }
        centered
        size="md"
      >
        <div style={{ position: "relative" }}>
          <LoadingOverlay visible={loading} />

          {created ? (
            <Stack align="center" spacing={4} py="xl">
              <ThemeIcon color="brand" variant="light" size={48} radius="xl">
                ✓
              </ThemeIcon>
              <Text color="dimmed" size="sm" mt="sm">
                {t("success_subtitle")}
              </Text>
            </Stack>
          ) : (
            <>
              <Stepper active={active} onStepClick={setActive} size="sm">
                <Stepper.Step
                  label={t("stepper.step1")}
                  allowStepSelect={false}
                >
                  <StepOne values={values} setValues={setValues} />
                </Stepper.Step>
                <Stepper.Step
                  label={t("stepper.step2")}
                  allowStepSelect={active > 0}
                >
                  <StepTwo
                    values={values}
                    setValues={setValues}
                    emailInput={emailInput}
                    setEmailInput={setEmailInput}
                    emailError={emailError}
                    setEmailError={setEmailError}
                  />
                </Stepper.Step>
              </Stepper>

              {submitError && (
                <Text size="sm" color="red" mt="md">
                  {submitError}
                </Text>
              )}

              <Group position="apart" mt="xl">
                {active === 1 ? (
                  <Button variant="subtle" onClick={() => setActive(0)}>
                    {t("back")}
                  </Button>
                ) : (
                  <Text size="xs" color="dimmed">
                    {t("step_indicator", { step: active + 1 })}
                  </Text>
                )}

                {active === 0 ? (
                  <Button
                    color="brand"
                    disabled={!canContinue}
                    onClick={() => setActive(1)}
                  >
                    {t("continue")}
                  </Button>
                ) : (
                  <Group spacing="xs">
                    <Button variant="subtle" onClick={submit}>
                      {t("skip")}
                    </Button>
                    <Button color="brand" onClick={submit}>
                      {t("create_project")}
                    </Button>
                  </Group>
                )}
              </Group>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}