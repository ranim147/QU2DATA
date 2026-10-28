import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import DashboardLayout from "../../../../src/layout/dashboardLayout";
import { withTranslations } from "../../../../src/helpers/HOC/withTranslations";
import { useProjectFiles } from "../../../../src/context/ProjectFileContext";
import {
  Alert,
  Checkbox,
  Loader,
  LoadingOverlay,
  Pagination,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { IconArrowRight, IconFile } from "@tabler/icons-react";
import { useTranslation } from "next-i18next";
import FileUploadZone from "../../../../src/components/files";
import FileMergeWizard from "../../../../src/components/files/file-merge/FileMergeWizard";
import { GET_FILES_BY_PROJECT } from "../../../../src/components/files/query";
import {
  GetFilesByProjectData,
  GetFilesByProjectVariables,
  ProjectFile,
  UploadedFile,
} from "../../../../src/components/files/types";
import { AppButton, AppTable, Card } from "../../../../src/ui";

const FILES_PER_PAGE = 20;

function formatFileSize(size: number | null) {
  if (size === null || !Number.isFinite(Number(size))) return "—";

  const bytes = Number(size);
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation("files");
  const { setProjectId, selectFile } = useProjectFiles();
  const routeProjectId = router.query.projectId;
  const projectId =
    typeof routeProjectId === "string" ? routeProjectId : undefined;
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState<ProjectFile[]>([]);
  const [mergeOpened, setMergeOpened] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery<
    GetFilesByProjectData,
    GetFilesByProjectVariables
  >(GET_FILES_BY_PROJECT, {
    variables: {
      projectId: projectId || "",
      page,
      limit: FILES_PER_PAGE,
    },
    skip: !projectId,
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    if (projectId) {
      setProjectId(projectId);
      setPage(1);
    }
  }, [projectId, setProjectId]);

  const handleUploaded = (file: UploadedFile) => {
    setUploadedFile(file);
    setRedirecting(true);
    selectFile(file.id);
    // autoGenerate=1 pour déclencher la génération automatique sans cliquer
    router.push(`/user/quality/${file.id}?autoGenerate=1`);
  };

  const openFile = (fileId: string) => {
    
  if (!projectId) return;

  selectFile(fileId);

  router.push(`/user/dictionary/${fileId}`);
};
  const toggleFileSelection = (file: ProjectFile) => {
    setSelectionError(null);
    setSelectedFiles((current) => {
      if (current.some((selected) => selected.id === file.id)) {
        return current.filter((selected) => selected.id !== file.id);
      }
      if (current.length >= 2) {
        setSelectionError(t("merge_selection_limit"));
        return current;
      }
      return [...current, file];
    });
  };

  const selectedPair: [ProjectFile, ProjectFile] | null =
    selectedFiles.length === 2
      ? [selectedFiles[0], selectedFiles[1]]
      : null;

  if (!projectId) {
    return null;
  }

  const filesPage = data?.getFilesByProject;
  const files = filesPage?.rows ?? [];
  const dateLocale = i18n.language === "en" ? "en-US" : "fr-FR";

  return (
    <DashboardLayout>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-[#84BF43]">
          Projet
        </p>
        <h1 className="text-2xl font-bold text-gray-900">Détail du projet</h1>
        <Text size="xs" color="dimmed">
          id : {projectId}
        </Text>
      </div>

      {!redirecting && (
        <FileUploadZone projectId={projectId} onUploaded={handleUploaded} />
      )}

      {redirecting && uploadedFile && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-[#84BF43] bg-[#f3fadf] p-5">
          <Loader color="brand" size="sm" />
          <div>
            <Text weight={600} size="sm">
              Fichier créé : {uploadedFile.name}
            </Text>
            <Text size="xs" color="dimmed">
              Redirection vers le diagnostic qualité...
            </Text>
          </div>
        </div>
      )}

      <div className="mt-8">
        <Card>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <Text weight={700} size="lg">
                {t("recent_files_title")}
              </Text>
              <Text size="sm" color="dimmed" mt={3}>
                {t("recent_files_subtitle")}
              </Text>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {filesPage && (
                <span className="rounded-full bg-[#f3fadf] px-3 py-1 text-xs font-bold text-[#548828]">
                  {t("files_count", { count: filesPage.count })}
                </span>
              )}
              <span className="text-xs font-semibold text-gray-500">
                {t("merge_selected_count", {
                  count: selectedFiles.length,
                })}
              </span>
              <AppButton
                onClick={() => setMergeOpened(true)}
                disabled={!selectedPair}
              >
                {t("merge_files_action")}
              </AppButton>
            </div>
          </div>

          {selectionError && (
            <Alert color="yellow" mb="md">
              {selectionError}
            </Alert>
          )}

          {error && (
            <Alert color="red" title={t("files_load_error_title")} mb="md">
              {error.message || t("files_load_error")}
            </Alert>
          )}

          {loading && !data ? (
            <div className="relative min-h-[180px]">
              <LoadingOverlay visible />
            </div>
          ) : files.length === 0 && !error ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/60 px-6 py-12 text-center">
              <ThemeIcon
                color="gray"
                variant="light"
                size={48}
                radius="xl"
                className="mx-auto"
              >
                <IconFile size={24} />
              </ThemeIcon>
              <Text weight={700} mt="md">
                {t("recent_files_empty_title")}
              </Text>
              <Text size="sm" color="dimmed" mt={4}>
                {t("recent_files_empty_subtitle")}
              </Text>
            </div>
          ) : (
            <>
              <div className="max-h-[520px] overflow-auto rounded-xl border border-gray-200">
                <AppTable>
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr>
                      <th aria-label={t("merge_select_file")} />
                      <th>{t("file_name")}</th>
                      <th>{t("file_type")}</th>
                      <th>{t("file_size")}</th>
                      <th>{t("imported_at")}</th>
                      <th aria-label={t("actions")} />
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file) => (
                      <tr key={file.id}>
                        <td>
                          <Checkbox
                            checked={selectedFiles.some(
                              (selected) => selected.id === file.id
                            )}
                            disabled={
                              selectedFiles.length >= 2 &&
                              !selectedFiles.some(
                                (selected) => selected.id === file.id
                              )
                            }
                            onChange={() => toggleFileSelection(file)}
                            aria-label={t("merge_select_named_file", {
                              name: file.name || t("unnamed_file"),
                            })}
                          />
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <ThemeIcon
                              color="brand"
                              variant="light"
                              size={34}
                              radius="md"
                            >
                              <IconFile size={17} />
                            </ThemeIcon>
                            <Text weight={600} size="sm">
                              {file.name || t("unnamed_file")}
                            </Text>
                          </div>
                        </td>
                        <td>{file.type || "—"}</td>
                        <td>{formatFileSize(file.size)}</td>
                        <td>
                          {file.createdAt
                            ? new Date(file.createdAt).toLocaleDateString(
                                dateLocale
                              )
                            : "—"}
                        </td>
                        <td>
                          <div className="flex justify-end gap-2">
                            <AppButton
                              intent="ghost"
                              size="xs"
                              rightIcon={<IconArrowRight size={14} />}
                              onClick={() => openFile(file.id)}
                            >
                              {t("open_file")}
                            </AppButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </AppTable>
              </div>

              {(filesPage?.totalPages ?? 0) > 1 && (
                <div className="mt-5 flex justify-end">
                  <Pagination
                    value={filesPage?.page ?? page}
                    total={filesPage?.totalPages ?? 1}
                    onChange={setPage}
                    radius="md"
                    size="sm"
                  />
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <FileMergeWizard
        opened={mergeOpened}
        projectId={projectId}
        files={selectedPair}
        onClose={() => {
          setMergeOpened(false);
          setSelectedFiles([]);
        }}
        onExecuted={async () => {
          setPage(1);
          await refetch({
            projectId,
            page: 1,
            limit: FILES_PER_PAGE,
          });
        }}
        onOpenFile={openFile}
      />
    </DashboardLayout>
  );
}

export const getServerSideProps = withTranslations(undefined, [
  "sidebar",
  "files",
  "projects",
]);
