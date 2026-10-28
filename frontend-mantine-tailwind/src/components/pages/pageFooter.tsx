import { ActionIcon, Group, Text } from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { Page } from "../../types/page.types";

interface Props {
  pages: Page[];
  activePageId: string | null;
  onSelectPage: (pageId: string) => void;
}

export default function PageFooter({ pages, activePageId, onSelectPage }: Props) {
  if (pages.length === 0) return null;

  const currentIndex = pages.findIndex((p) => p.id === activePageId);
  const total = pages.length;

  function goTo(index: number) {
    if (index < 0 || index >= total) return;
    onSelectPage(pages[index].id);
  }

  return (
    <Group position="center" spacing="xs" mt="sm">
      <ActionIcon
        onClick={() => goTo(currentIndex - 1)}
        disabled={currentIndex <= 0}
        title="Page précédente"
      >
        <IconChevronLeft size={16} />
      </ActionIcon>

      <Text size="sm" color="dimmed">
        Page {currentIndex + 1}/{total}
      </Text>

      <ActionIcon
        onClick={() => goTo(currentIndex + 1)}
        disabled={currentIndex >= total - 1}
        title="Page suivante"
      >
        <IconChevronRight size={16} />
      </ActionIcon>
    </Group>
  );
}