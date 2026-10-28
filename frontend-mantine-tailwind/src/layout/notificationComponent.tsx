import {
  DefaultMantineColor,
  MantineNumberSize,
  Notification,
} from "@mantine/core";

interface notificationProps {
  color?: DefaultMantineColor;
  radius?: MantineNumberSize;
  title: String;
  description: String;
  loading?: boolean;
  closeAction: () => void;
}
export default function NotificationComponent(props: notificationProps) {
  const { color, radius, title, description, loading, closeAction } = props;

  return (
    <Notification
      loading={loading || false}
      color={color || "indigo"}
      radius={radius || "lg"}
      title={title}
      onClose={closeAction}
    >
      {description}
    </Notification>
  );
}
