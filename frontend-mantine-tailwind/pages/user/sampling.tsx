import { useEffect, useState } from "react";
import { Alert } from "@mantine/core";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

import { withTranslations } from "../../src/helpers/HOC/withTranslations";
import DashboardLayout from "../../src/layout/dashboardLayout";
import { getLastFileId } from "../../src/utils/lastFile";
import { getLastProjectId } from "../../src/utils/lastProject";
import { AppButton, PageHeader } from "../../src/ui";

export default function SamplingPage() {
  const router = useRouter();
  const { t } = useTranslation("sampling");
  const [hasActiveFile, setHasActiveFile] = useState<boolean | null>(null);

  useEffect(() => {
    const projectId = getLastProjectId();
    const fileId = getLastFileId();

    if (projectId && fileId) {
      setHasActiveFile(true);
      void router.replace(
        `/user/projects/${projectId}/files/${fileId}/sampling`
      );
      return;
    }

    setHasActiveFile(false);
  }, [router]);

  return (
    <DashboardLayout>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {hasActiveFile === false && (
        <Alert color="yellow" title={t("noActiveFile.title")}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span>{t("noActiveFile.description")}</span>
            <AppButton onClick={() => void router.push("/user/projects")}>
              {t("actions.openProject")}
            </AppButton>
          </div>
        </Alert>
      )}
    </DashboardLayout>
  );
}

export const getStaticProps = withTranslations(undefined, [
  "sidebar",
  "sampling",
]);
