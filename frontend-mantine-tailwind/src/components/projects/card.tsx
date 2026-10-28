import { Project } from "src/types/project.types"
import Link from "next/link";
import { IconFolder, IconChartBar } from "@tabler/icons-react";
import { LoadingOverlay, Text, ThemeIcon } from "@mantine/core";
import { useTranslation } from "next-i18next";

interface Props{
    project:Project
}
export default function ProjectCard(props:Props){
      const { t } = useTranslation("projects");
    
    const {project}=props;
    return(
          <Link key={project.id} href={`/user/projects/${project.id}`} legacyBehavior>
          <a className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-[#84BF43] hover:shadow-md transition-all">
            <div className="flex items-start gap-3">
              <ThemeIcon color="brand" variant="light" size={38} radius="md">
                <IconFolder size={19} />
              </ThemeIcon>
              <div className="min-w-0 flex-1">
                <Text weight={600} size="sm" className="truncate">
                  {project.name}
                </Text>
                {project.domain && (
                  <Text size="xs" color="dimmed" className="truncate">
                    {project.domain}
                  </Text>
                )}
              </div>
            </div>
            {project.description && (
              <p className="mt-3 text-xs text-gray-500 line-clamp-2">
                {project.description}
              </p>
            )}
            <p className="mt-4 text-[11px] text-gray-400">
              {t("created_on", { date: new Date(Number(project.createdAt)).toLocaleString() })}
            </p>
          </a>
        </Link>
    )
}