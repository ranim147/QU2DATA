import { useEffect } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

import SamplingWorkspace from "../../../../../../src/components/sampling/SamplingWorkspace";
import { withTranslations } from "../../../../../../src/helpers/HOC/withTranslations";
import DashboardLayout from "../../../../../../src/layout/dashboardLayout";
import { AppButton, PageHeader } from "../../../../../../src/ui";
import { setLastFileId } from "../../../../../../src/utils/lastFile";
import { setLastProjectId } from "../../../../../../src/utils/lastProject";

export default function FileSamplingPage() {
  const router = useRouter();
  const { t } = useTranslation("sampling");
  const projectId =
    typeof router.query.projectId === "string"
      ? router.query.projectId
      : undefined;
  const fileId =
    typeof router.query.fileId === "string" ? router.query.fileId : undefined;

  useEffect(() => {
    if (projectId && fileId) {
      setLastProjectId(projectId);
      setLastFileId(fileId);
    }
  }, [fileId, projectId]);

  const backToProject = () => {
    if (projectId) {
      void router.push(`/user/projects/${projectId}`);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          <AppButton
            intent="ghost"
            disabled={!projectId}
            onClick={backToProject}
          >
            {t("actions.backToProject")}
          </AppButton>
        }
      />

      {projectId && fileId ? (
        <SamplingWorkspace fileId={fileId} projectId={projectId} />
      ) : (
        <div className="flex min-h-[320px] items-center justify-center text-sm text-gray-500">
          {t("loadingRoute")}
        </div>
      )}
    </DashboardLayout>
  );
}

export const getServerSideProps = withTranslations(undefined, [
  "sidebar",
  "sampling",
]);
