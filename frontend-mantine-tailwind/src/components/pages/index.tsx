import { useEffect } from "react";
import { useTranslation } from "next-i18next";
import { useMutation, useQuery } from "@apollo/client";
import { Tabs, ActionIcon, LoadingOverlay, Box } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import PageTabLabel from "./tabLabel";
import { GET_PAGES_QUERY, GetPagesType, GetPagesVariables } from "./query";
import {
  CREATE_PAGE_MUTATION,
  CreatePageType,
  CreatePageVariables,
  UPDATE_PAGE_MUTATION,
  UpdatePageType,
  UpdatePageVariables,
} from "./mutation";
import { Page } from "../../types/page.types";

interface Props {
  projectId: string;
  activePageId: string | null;
  onSelectPage: (pageId: string) => void;
  onPagesLoaded?: (pages: Page[]) => void;
}

export default function PageTabs({
  projectId,
  activePageId,
  onSelectPage,
  onPagesLoaded,
}: Props) {
  const { t } = useTranslation("pages");

  const { data, loading, error, refetch } = useQuery<GetPagesType, GetPagesVariables>(
    GET_PAGES_QUERY,
    { variables: { projectId } }
  );

  const pages = data?.getPages ?? [];

  const [createPage] = useMutation<CreatePageType, CreatePageVariables>(
    CREATE_PAGE_MUTATION
  );

  const [updatePage] = useMutation<UpdatePageType, UpdatePageVariables>(
    UPDATE_PAGE_MUTATION
  );

  // Select the first page after render, avoiding a parent state update while
  // PageTabs itself is rendering.
  useEffect(() => {
    if (!loading && !activePageId && pages.length > 0) {
      onSelectPage(pages[0].id);
    }
  }, [loading, activePageId, pages, onSelectPage]);

  // Share the loaded pages list with the parent component
  useEffect(() => {
    onPagesLoaded?.(pages);
  }, [data]);

  async function handleAddPage() {
    const res = await createPage({
      variables: { projectId, title: `Page ${pages.length + 1}` },
    });
    const newPage = res.data?.createPage.page;
    if (newPage) {
      await refetch();
      onSelectPage(newPage.id);
    }
  }

  function handleRenamePage(pageId: string, title: string) {
    updatePage({ variables: { pageId, title } });
  }

  if (error) return null;

  return (
    <Box sx={{ position: "relative" }}>
      <LoadingOverlay visible={loading} />

      <Tabs value={activePageId} onTabChange={(value) => value && onSelectPage(value)}>
        <Tabs.List>
          {pages.map((page, index) => (
            <Tabs.Tab key={page.id} value={page.id}>
              <PageTabLabel
                index={index}
                page={page}
                onRename={(title) => handleRenamePage(page.id, title)}
              />
            </Tabs.Tab>
          ))}

          <ActionIcon onClick={handleAddPage} title={t("add_page")} ml="xs">
            <IconPlus size={16} />
          </ActionIcon>
        </Tabs.List>
      </Tabs>
    </Box>
  );
}
