import { useRouter } from "next/router";
import TransformationPipeline from "../../../../../../src/components/transformations";
import { withTranslations } from "../../../../../../src/helpers/HOC/withTranslations";
import DashboardLayout from "../../../../../../src/layout/dashboardLayout";

function routeParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function TransformationsPage() {
  const router = useRouter();
  const projectId = routeParam(router.query.projectId);
  const fileId = routeParam(router.query.fileId);

  return (
    <DashboardLayout>
      {projectId && fileId ? (
        <TransformationPipeline projectId={projectId} fileId={fileId} />
      ) : (
        <div className="flex min-h-[320px] items-center justify-center text-sm text-gray-500">
          Chargement du projet et du fichier…
        </div>
      )}
    </DashboardLayout>
  );
}

export const getServerSideProps = withTranslations(undefined, [
  "sidebar",
  "transformations",
]);
