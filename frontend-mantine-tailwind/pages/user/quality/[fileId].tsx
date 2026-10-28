import { useRouter } from "next/router";
import DashboardLayout from "../../../src/layout/dashboardLayout";
import { withTranslations } from "../../../src/helpers/HOC/withTranslations";
import DataQualityPanel from "../../../src/components/dataQualityReports";

export default function QualityPage() {
  const router = useRouter();
  const { fileId } = router.query;

  // Le fileId vient de l'URL, ex: /user/quality/abc-123
  // Tant que Next.js n'a pas fini d'hydrater la route, il peut être undefined
  if (!fileId || typeof fileId !== "string") {
    return null;
  }

  return (
    <DashboardLayout>
      <DataQualityPanel fileId={fileId} autoGenerate={true} />
    </DashboardLayout>
  );
}

export const getStaticProps = withTranslations(undefined, [
  "sidebar",
  "dataQuality",
]);

// Nécessaire pour une route dynamique ([fileId]) avec getStaticProps
export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}