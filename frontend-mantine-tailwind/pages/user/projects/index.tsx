import DashboardLayout from "../../../src/layout/dashboardLayout";
import { withTranslations } from "../../../src/helpers/HOC/withTranslations";
import { useTranslation } from "next-i18next";
import { useQuery } from "@apollo/client";
import Projects from "../../../src/components/projects";
import ProjectList from "../../../src/components/projects/list";
import { GET_PROJECTS_QUERY, GetProjectsType } from "../../../src/components/projects/query";

export default function ProjectsPage() {
  const { t } = useTranslation("projects");

  const { data, loading, refetch } = useQuery<GetProjectsType>(
    GET_PROJECTS_QUERY,
    { variables: { page: 1, limit: 50 }, fetchPolicy: "cache-and-network" }
  );

  const projects = data?.getProjects.rows ?? [];

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#84BF43] mb-1">
            {t("page_eyebrow")}
          </p>
          <h1 className="text-3xl font-bold text-gray-900">{t("page_title")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("page_subtitle")}</p>
        </div>

        <Projects refetchProjects={() => refetch()} />
      </div>

      <ProjectList projects={projects} loading={loading && !data} />
    </DashboardLayout>
  );
}

export const getStaticProps = withTranslations(undefined, [
  "sidebar",
  "projects",
]);