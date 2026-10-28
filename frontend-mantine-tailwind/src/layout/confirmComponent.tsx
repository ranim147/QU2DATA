import { Text } from "@mantine/core";
import { useTranslation } from "next-i18next";
import { AppButton, AppModal } from "../ui";

interface CustomConfirmProps {
  buttonColor?: string;
  buttonLabel?: string;
}
interface Props {
  opened: boolean;
  title: string;
  description: string;
  confirmAction: () => void;
  onClose: () => void;
  customConfirmProps?: CustomConfirmProps;
}

export default function ConfirmComponent(props: Props) {
  const { opened, description, title, confirmAction, onClose, customConfirmProps } = props;
  const { t } = useTranslation();

  return (
    <AppModal opened={opened} onClose={onClose} title={title} size="sm">
      <Text size="sm" color="dimmed">{description}</Text>
      <div className="flex mt-6 gap-3 justify-end">
        <AppButton intent="ghost" onClick={onClose}>
          {t("common:cancel")}
        </AppButton>
        <AppButton
          intent={customConfirmProps?.buttonColor ? "primary" : "danger"}
          onClick={confirmAction}
        >
          {customConfirmProps?.buttonLabel ?? t("common:delete")}
        </AppButton>
      </div>
    </AppModal>
  );
}
