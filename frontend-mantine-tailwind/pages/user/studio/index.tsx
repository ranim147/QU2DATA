import DashboardLayout from "../../../src/layout/dashboardLayout";
import { withTranslations } from "../../../src/helpers/HOC/withTranslations";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { IconFolder, IconChartBar } from "@tabler/icons-react";

export default function StudioLandingPage() {
  const { t } = useTranslation("pages");

  return (
    <DashboardLayout>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#84BF43] mb-1">
          Studio
        </p>
        <h1 className="text-3xl font-bold text-gray-900">Studio</h1>
        <p className="text-sm text-gray-500 mt-1">
          Créez et gérez vos pages de visualisation de données
        </p>
      </div>

      <div className="max-w-lg">
        <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="h-14 w-14 rounded-xl bg-[#f3fadf] flex items-center justify-center mb-5">
            <IconChartBar size={28} className="text-[#548828]" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun projet sélectionné
          </h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Veuillez d'abord sélectionner un projet pour accéder à son studio.
            Vous pouvez créer ou ouvrir un projet depuis la page des projets.
          </p>
          <Link
            href="/user/projects"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <IconFolder size={18} />
            Aller aux projets
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

export const getStaticProps = withTranslations(undefined, ["sidebar", "pages"]);

