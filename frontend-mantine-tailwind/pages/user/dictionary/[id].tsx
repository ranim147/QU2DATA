import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import DashboardLayout from "../../../src/layout/dashboardLayout";
import { withTranslations } from "../../../src/helpers/HOC/withTranslations";
import FeatureDictionary from "../../../src/components/features";

export default function DictionaryDetailPage() {
  const router = useRouter();
  const { id } = router.query; // fileId, vient de l'URL /user/dictionary/[id]
  const { t } = useTranslation("features");

  if (!id || typeof id !== "string") {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-[#84BF43]">
          {t("page_eyebrow")}
        </p>
        <h1 className="text-2xl font-bold text-gray-900">{t("page_title")}</h1>
      </div>

      <FeatureDictionary fileId={id} />
    </DashboardLayout>
  );
}

export const getStaticProps = withTranslations(undefined, [
  "sidebar",
  "features",
]);

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}