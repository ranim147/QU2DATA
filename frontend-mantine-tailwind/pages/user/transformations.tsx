import { Text, Button } from "@mantine/core";
import { useRouter } from "next/router";
import TransformationPipeline from "../../src/components/transformations";
import { withTranslations } from "../../src/helpers/HOC/withTranslations";
import { useProjectFiles } from "../../src/context/ProjectFileContext";
import DashboardLayout from "../../src/layout/dashboardLayout";
import { PageHeader } from "../../src/ui";

export default function TransformationsPage() {
  const router = useRouter();
  const { selectedFileId, projectId } = useProjectFiles();

  // Si aucun fichier sélectionné dans le contexte, rediriger vers la page projet
  if (!selectedFileId) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Transformations"
          subtitle="Sélectionnez d'abord un fichier dans votre projet."
        />
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/60 px-6 py-16 text-center">
          <Text weight={700}>Aucun fichier sélectionné</Text>
          <Text size="sm" color="dimmed" mt={4}>
            Veuillez d'abord sélectionner un fichier depuis la page Projet pour accéder aux transformations.
          </Text>
          <Button color="brand" mt="lg" onClick={() => router.push(projectId ? `/user/projects/${projectId}` : "/user/projects")}>
            Aller à mes projets
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Transformations"
        subtitle="Configurez le pipeline de transformations pour le fichier sélectionné."
      />
      <TransformationPipeline fileId={selectedFileId} />
    </DashboardLayout>
  );
}

export const getStaticProps = withTranslations(undefined, ["sidebar","transformations", "common"]);

