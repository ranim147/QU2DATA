import { useRouter } from "next/router";
import DashboardLayout from "../../src/layout/dashboardLayout";
import { withTranslations } from "../../src/helpers/HOC/withTranslations";
import { useProjectFiles } from "../../src/context/ProjectFileContext";
import { Text, Button } from "@mantine/core";

export default function DictionaryPage() {
  const router = useRouter();
  const { selectedFileId, projectId } = useProjectFiles();

  if (!selectedFileId) {
    return (
      <DashboardLayout>
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#84BF43]">
            Dictionnaire
          </p>
          <h1 className="text-2xl font-bold text-gray-900">Aucun fichier sélectionné</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sélectionnez d'abord un fichier depuis la page Projet pour voir son dictionnaire de variables.
          </p>
        </div>
        <Button color="brand" onClick={() => router.push(projectId ? `/user/projects/${projectId}` : "/user/projects")}>
          Aller à mes projets
        </Button>
      </DashboardLayout>
    );
  }

  // Rediriger vers la page dynamique avec le fileId de l'URL
  router.replace(`/user/dictionary/${selectedFileId}`);
  return null;
}

export const getStaticProps = withTranslations(undefined, [
  "sidebar",
  "features"
]);
