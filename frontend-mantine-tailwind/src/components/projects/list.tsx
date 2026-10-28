import { useTranslation } from "next-i18next";
import { LoadingOverlay, Text, ThemeIcon } from "@mantine/core";
import {IconChartBar } from "@tabler/icons-react";
import { Project } from "../../types/project.types";
import ProjectCard from "./card";


interface ListProps {
  projects: Project[];
  loading: boolean;
}



export default function ProjectList({ projects, loading }: ListProps) {
  const { t } = useTranslation("projects");

  if (loading) {
    return (
      <div style={{ position: "relative", minHeight: 200 }}>
        <LoadingOverlay visible />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/60 px-6 py-14 text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-white border border-gray-100 shadow-lg shadow-gray-200/70 flex items-center justify-center mb-4">
          <IconChartBar size={26} className="text-[#84BF43]" />
        </div>
        <h2 className="font-bold text-gray-900">{t("list_empty_title")}</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
          {t("list_empty_desc")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <ProjectCard project={project}/>
      ))}
    </div>
  );
}