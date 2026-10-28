import Link from "next/link";
import DashboardLayout from "../../src/layout/dashboardLayout";
import { withTranslations } from "../../src/helpers/HOC/withTranslations";
import { useAuthContext } from "../../src/context/AuthContext";
import { useTranslation } from "next-i18next";
import Projects from "../../src/components/projects";
import {
  IconFolder,
  IconChartHistogram,
  IconFileAnalytics,
  IconDatabase,
  IconChartBar,
} from "@tabler/icons-react";

const kpis = [
  { key: "kpi_projects", icon: IconFolder, href: "/user/projects" },
  { key: "kpi_analyses", icon: IconChartHistogram, href: null },
  { key: "kpi_reports", icon: IconFileAnalytics, href: null },
  { key: "kpi_sources", icon: IconDatabase, href: null },
];

export default function Dashboard() {
  const { user } = useAuthContext();
  const { t } = useTranslation("dashboard");

  return (
    <DashboardLayout>
      {/* Welcome */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#84BF43] mb-1">
            {t("eyebrow")}
          </p>
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.user_name ? t("welcome", { name: user.user_name }) : t("title")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
        </div>

        <Projects />
      </div>

      {/* KPI placeholders */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(({ key, icon: Icon, href }) => {
          const card = (
            <div
              className={`bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 ${
                href ? "hover:border-[#84BF43] hover:shadow-md transition-all cursor-pointer" : ""
              }`}
            >
              <div className="h-10 w-10 shrink-0 rounded-lg bg-[#f3fadf] border border-[#84BF43] flex items-center justify-center">
                <Icon size={20} className="text-[#548828]" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-300 leading-none">
                  —
                </p>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mt-1">
                  {t(key)}
                </p>
              </div>
            </div>
          );

          return href ? (
            <Link key={key} href={href} legacyBehavior>
              <a>{card}</a>
            </Link>
          ) : (
            <div key={key}>{card}</div>
          );
        })}
      </div>

      {/* Analytics empty state */}
      <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/60 px-6 py-14 text-center mb-10">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-white border border-gray-100 shadow-lg shadow-gray-200/70 flex items-center justify-center mb-4">
          <IconChartBar size={26} className="text-[#84BF43]" />
        </div>
        <h2 className="font-bold text-gray-900">{t("empty_title")}</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
          {t("empty_desc")}
        </p>
        <span className="inline-block mt-4 rounded-full bg-[#f3fadf] border border-[#84BF43] px-4 py-1 text-xs font-bold text-[#548828] uppercase tracking-wide">
          {t("empty_badge")}
        </span>
      </div>

    </DashboardLayout>
  );
}

export const getStaticProps = withTranslations(undefined, [
  "sidebar",
  "dashboard",
  "projects",
]);