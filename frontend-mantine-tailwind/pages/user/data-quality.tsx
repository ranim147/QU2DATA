import { useRouter } from "next/router";
import DashboardLayout from "../../src/layout/dashboardLayout";
import { withTranslations } from "../../src/helpers/HOC/withTranslations";
import { useProjectFiles } from "../../src/context/ProjectFileContext";
import DataQualityPanel from "../../src/components/dataQualityReports";
import { Button } from "@mantine/core";

export default function DataQualityPage() {
  const router = useRouter();
  const { selectedFileId, projectId } = useProjectFiles();

  if (!selectedFileId) {
    return (
      <DashboardLayout>
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#84BF43]">
            Data Quality
          </p>
          <h1 className="text-2xl font-bold text-gray-900">Aucun fichier sélectionné</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sélectionnez d'abord un fichier depuis la page Projet pour voir son diagnostic de qualité.
          </p>
        </div>
        <Button
          color="brand"
          onClick={() => router.push(projectId ? `/user/projects/${projectId}` : "/user/projects")}
        >
          Aller à mes projets
        </Button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DataQualityPanel fileId={selectedFileId} autoGenerate={true} />
    </DashboardLayout>
  );
}

export const getStaticProps = withTranslations(undefined, [
  "sidebar",
  "dataQuality",
]);