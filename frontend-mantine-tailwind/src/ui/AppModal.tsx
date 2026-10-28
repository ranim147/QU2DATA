import { Modal, ModalProps } from "@mantine/core";
import { ReactNode } from "react";

interface AppModalProps extends Omit<ModalProps, "title"> {
  title: string;
  children: ReactNode;
}

export function AppModal({ title, children, ...rest }: AppModalProps) {
  return (
    <Modal
      centered
      size="md"
      padding="xl"
      title={
        <span className="text-base font-bold text-gray-900">{title}</span>
      }
      styles={{
        header: { borderBottom: "1px solid #f3f4f6", paddingBottom: 12 },
        body: { paddingTop: 20 },
      }}
      {...rest}
    >
      {children}
    </Modal>
  );
}
