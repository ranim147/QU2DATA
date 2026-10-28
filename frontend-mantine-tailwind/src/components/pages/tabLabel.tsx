import { useState } from "react";
import { TextInput, Text } from "@mantine/core";
import { Page } from "../../types/page.types";

interface Props {
  index: number;
  page: Page;
  onRename: (title: string) => void;
}

export default function PageTabLabel({ index, page, onRename }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(page.title);

  function confirm() {
    setEditing(false);
    if (value.trim() && value.trim() !== page.title) {
      onRename(value.trim());
    }
  }

  if (editing) {
    return (
      <TextInput
        autoFocus
        size="xs"
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        onBlur={confirm}
        onKeyDown={(e) => e.key === "Enter" && confirm()}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <Text
      size="sm"
      weight={500}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
    >
      {index + 1} {page.title}
    </Text>
  );
}