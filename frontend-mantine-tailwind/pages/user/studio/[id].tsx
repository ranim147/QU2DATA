import { useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import DashboardLayout from "../../../src/layout/dashboardLayout";
import { withTranslations } from "../../../src/helpers/HOC/withTranslations";
import PageTabs from "../../../src/components/pages";
import PageFooter from "../../../src/components/pages/pageFooter";
import PageFormatSelector from "../../../src/components/pages/pageFormatSelector";
import PageCanvas from "../../../src/components/pages/pageCanvas";
import { Page } from "../../../src/types/page.types";
import Widgets from "../../../src/components/widgets";

export default function StudioDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation("pages");

  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [pages, setPages] = useState<Page[]>([]);

  if (!id || typeof id !== "string") {
    return null;
  }

  const activePage = pages.find((p) => p.id === activePageId) ?? null;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-[#84BF43]">
          {t("page_eyebrow")}
        </p>
        <h1 className="text-2xl font-bold text-gray-900">{t("page_title")}</h1>
      </div>

      <PageTabs
        projectId={id}
        activePageId={activePageId}
        onSelectPage={setActivePageId}
        onPagesLoaded={setPages}
      />

      {activePage && (
        <div className="mt-4">
          <PageFormatSelector page={activePage} />
        </div>
      )}

      {activePage && (
        <div className="mt-4">
          <PageCanvas page={activePage}>
            <Widgets
              key={activePage.id}
              page={activePage}
              pages={pages}
              projectId={id}
              onSelectPage={setActivePageId}
            />
          </PageCanvas>
        </div>
      )}

      <PageFooter
        pages={pages}
        activePageId={activePageId}
        onSelectPage={setActivePageId}
      />
    </DashboardLayout>
  );
}

export const getStaticProps = withTranslations(undefined, [
  "sidebar",
  "pages",
]);

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}
