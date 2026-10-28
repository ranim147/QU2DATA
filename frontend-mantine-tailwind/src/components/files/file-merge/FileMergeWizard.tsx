import { useLazyQuery, useMutation } from "@apollo/client";
import {
  Alert,
  Badge,
  Checkbox,
  Divider,
  LoadingOverlay,
  MultiSelect,
  NumberInput,
  Progress,
  Select,
  Stepper,
  Text,
  TextInput,
} from "@mantine/core";
import { IconAlertTriangle, IconCheck, IconPlus, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "next-i18next";
import { useEffect, useMemo, useState } from "react";
import ConfirmComponent from "../../../layout/confirmComponent";
import { AppButton, AppModal } from "../../../ui";
import { ProjectFile } from "../types";
import FileMergePreviewTable from "./FileMergePreviewTable";
import {
  EXECUTE_FILE_MERGE,
  PREVIEW_FILE_MERGE,
  RECOMMEND_FILE_MERGE,
} from "./operations";
import {
  ExecuteFileMergeData,
  FileMergeOperation,
  FileMergePreview,
  FileMergeRecommendation,
  MergeConfiguration,
  PreviewFileMergeData,
  RecommendFileMergeData,
} from "./types";

const initialConfiguration = (): MergeConfiguration => ({
  operation: null,
  columnMapping: {},
  joinKeys: [],
  joinType: "left",
  addSourceColumn: true,
  sourceColumnName: "_source_file",
  previewLimit: 20,
  rightPrecedence: true,
  updateNonNullOnly: true,
});

function operationLabel(operation: string, t: (key: string) => string) {
  return t(`merge_operation_${operation.toLowerCase()}`);
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

interface Props {
  opened: boolean;
  projectId: string;
  files: [ProjectFile, ProjectFile] | null;
  onClose: () => void;
  onExecuted: (file: ProjectFile) => Promise<void> | void;
  onOpenFile: (fileId: string) => void;
}

export default function FileMergeWizard({
  opened,
  projectId,
  files,
  onClose,
  onExecuted,
  onOpenFile,
}: Props) {
  const { t } = useTranslation("files");
  const [active, setActive] = useState(0);
  const [recommendation, setRecommendation] =
    useState<FileMergeRecommendation | null>(null);
  const [configuration, setConfiguration] =
    useState<MergeConfiguration>(initialConfiguration);
  const [preview, setPreview] = useState<FileMergePreview | null>(null);
  const [outputName, setOutputName] = useState("");
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [confirmOpened, setConfirmOpened] = useState(false);
  const [createdFile, setCreatedFile] = useState<ProjectFile | null>(null);

  const [loadRecommendation, { loading: recommending }] =
    useLazyQuery<RecommendFileMergeData>(RECOMMEND_FILE_MERGE, {
      fetchPolicy: "network-only",
    });
  const [loadPreview, { loading: previewing }] =
    useLazyQuery<PreviewFileMergeData>(PREVIEW_FILE_MERGE, {
      fetchPolicy: "network-only",
    });
  const [executeMerge, { loading: executing }] =
    useMutation<ExecuteFileMergeData>(EXECUTE_FILE_MERGE);

  useEffect(() => {
    if (!opened || !files) return;

    let cancelled = false;
    setActive(0);
    setRecommendation(null);
    setConfiguration(initialConfiguration());
    setPreview(null);
    setOutputName("");
    setWorkflowError(null);
    setCreatedFile(null);
    setConfirmOpened(false);

    loadRecommendation({
      variables: {
        input: {
          projectId,
          leftFileId: files[0].id,
          rightFileId: files[1].id,
        },
      },
    })
      .then(({ data }) => {
        if (cancelled) return;
        const response = data?.recommendFileMerge;
        if (!response?.success || !response.data) {
          setWorkflowError(
            response?.message || t("merge_recommendation_error")
          );
          return;
        }

        setRecommendation(response.data);
        setConfiguration((current) => ({
          ...current,
          operation:
            response.data?.recommendedOperation === "MANUAL_REVIEW"
              ? null
              : response.data?.recommendedOperation || null,
          joinKeys:
            response.data?.candidateKeys[0]?.columns || current.joinKeys,
        }));
      })
      .catch((error) => {
        if (!cancelled) {
          setWorkflowError(
            errorMessage(error, t("merge_recommendation_error"))
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [opened, projectId, files?.[0]?.id, files?.[1]?.id]);

  const allRightColumns = useMemo(() => {
    if (!recommendation) return [];
    return Array.from(
      new Set([
        ...recommendation.commonColumns,
        ...recommendation.rightOnlyColumns,
      ])
    );
  }, [recommendation]);

  const availableJoinKeys = useMemo(() => {
    if (!recommendation) return [];
    const mappedTargets = Object.values(configuration.columnMapping);
    return Array.from(
      new Set([...recommendation.commonColumns, ...mappedTargets])
    );
  }, [recommendation, configuration.columnMapping]);

  const invalidatePreview = () => {
    setPreview(null);
    setCreatedFile(null);
    setWorkflowError(null);
  };

  const updateConfiguration = (values: Partial<MergeConfiguration>) => {
    invalidatePreview();
    setConfiguration((current) => ({ ...current, ...values }));
  };

  const addMapping = () => {
    const source = allRightColumns.find(
      (column) => !(column in configuration.columnMapping)
    );
    if (!source) return;
    updateConfiguration({
      columnMapping: {
        ...configuration.columnMapping,
        [source]: source,
      },
    });
  };

  const updateMapping = (
    previousSource: string,
    source: string,
    target: string
  ) => {
    const next = { ...configuration.columnMapping };
    delete next[previousSource];
    if (source) next[source] = target;
    updateConfiguration({ columnMapping: next });
  };

  const removeMapping = (source: string) => {
    const next = { ...configuration.columnMapping };
    delete next[source];
    updateConfiguration({ columnMapping: next });
  };

  const validateConfiguration = () => {
    if (!configuration.operation) return t("merge_operation_required");
    if (
      ["JOIN_BY_KEY", "UPSERT"].includes(configuration.operation) &&
      configuration.joinKeys.length === 0
    ) {
      return t("merge_join_keys_required");
    }
    if (
      configuration.addSourceColumn &&
      !configuration.sourceColumnName.trim()
    ) {
      return t("merge_source_column_required");
    }
    if (
      Object.entries(configuration.columnMapping).some(
        ([source, target]) => !source.trim() || !target.trim()
      )
    ) {
      return t("merge_mapping_invalid");
    }
    return null;
  };

  const buildConfigurationInput = () => ({
    projectId,
    leftFileId: files![0].id,
    rightFileId: files![1].id,
    operation: configuration.operation,
    columnMapping: configuration.columnMapping,
    joinKeys: configuration.joinKeys,
    joinType: configuration.joinType,
    addSourceColumn: configuration.addSourceColumn,
    sourceColumnName: configuration.sourceColumnName.trim(),
    previewLimit: configuration.previewLimit,
    rightPrecedence: configuration.rightPrecedence,
    updateNonNullOnly: configuration.updateNonNullOnly,
  });

  const requestPreview = async () => {
    const validationError = validateConfiguration();
    if (validationError) {
      setWorkflowError(validationError);
      return;
    }

    setWorkflowError(null);
    try {
      const { data } = await loadPreview({
        variables: { input: buildConfigurationInput() },
      });
      const response = data?.previewFileMerge;
      if (!response?.success || !response.data) {
        setWorkflowError(response?.message || t("merge_preview_error"));
        return;
      }
      setPreview(response.data);
      setActive(2);
    } catch (error) {
      setWorkflowError(errorMessage(error, t("merge_preview_error")));
    }
  };

  const confirmExecution = () => {
    const name = outputName.trim();
    if (!preview) {
      setWorkflowError(t("merge_preview_required"));
      return;
    }
    if (!name || name.length > 255) {
      setWorkflowError(t("merge_output_name_invalid"));
      return;
    }
    setWorkflowError(null);
    setConfirmOpened(true);
  };

  const runExecution = async () => {
    setConfirmOpened(false);
    setWorkflowError(null);
    try {
      const { data } = await executeMerge({
        variables: {
          input: {
            ...buildConfigurationInput(),
            outputName: outputName.trim(),
          },
        },
      });
      const response = data?.executeFileMerge;
      if (!response?.success || !response.file) {
        setWorkflowError(response?.message || t("merge_execute_error"));
        return;
      }
      setCreatedFile(response.file);
      await onExecuted(response.file);
      setActive(3);
    } catch (error) {
      setWorkflowError(errorMessage(error, t("merge_execute_error")));
    }
  };

  if (!files) return null;

  const mappingEntries = Object.entries(configuration.columnMapping);
  const operationOptions: Array<{ value: FileMergeOperation; label: string }> = [
    {
      value: "CONCAT_VERTICAL",
      label: operationLabel("CONCAT_VERTICAL", t),
    },
    { value: "JOIN_BY_KEY", label: operationLabel("JOIN_BY_KEY", t) },
    { value: "UPSERT", label: operationLabel("UPSERT", t) },
  ];

  return (
    <>
      <AppModal
        opened={opened}
        onClose={executing ? () => undefined : onClose}
        closeOnClickOutside={!executing}
        closeOnEscape={!executing}
        title={t("merge_title")}
        size="xl"
      >
        <div className="relative">
          <LoadingOverlay visible={recommending || executing} />

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {files.map((file, index) => (
              <div
                key={file.id}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
              >
                <Text size="xs" color="dimmed">
                  {index === 0 ? t("merge_left_file") : t("merge_right_file")}
                </Text>
                <Text weight={700} size="sm" className="truncate">
                  {file.name || t("unnamed_file")}
                </Text>
              </div>
            ))}
          </div>

          <Stepper active={active} size="sm" mb="xl">
            <Stepper.Step label={t("merge_step_recommendation")} />
            <Stepper.Step label={t("merge_step_configuration")} />
            <Stepper.Step label={t("merge_step_preview")} />
            <Stepper.Completed>
              <span />
            </Stepper.Completed>
          </Stepper>

          {workflowError && (
            <Alert color="red" title={t("merge_error_title")} mb="md">
              {workflowError}
            </Alert>
          )}

          {active === 0 && (
            <div className="space-y-5">
              {recommending && (
                <div className="min-h-[180px]" />
              )}

              {recommendation && (
                <>
                  {recommendation.recommendedOperation === "MANUAL_REVIEW" && (
                    <Alert
                      color="yellow"
                      icon={<IconAlertTriangle size={18} />}
                      title={t("merge_manual_review_title")}
                    >
                      {t("merge_manual_review_message")}
                    </Alert>
                  )}

                  <div className="rounded-xl border border-[#d1ec96] bg-[#fafff4] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <Text size="xs" color="dimmed">
                          {t("merge_recommended_operation")}
                        </Text>
                        <Text weight={800} size="lg">
                          {operationLabel(
                            recommendation.recommendedOperation,
                            t
                          )}
                        </Text>
                      </div>
                      <Badge color="brand" size="lg" variant="light">
                        {t("merge_confidence", {
                          value: Math.round(
                            recommendation.confidenceScore * 100
                          ),
                        })}
                      </Badge>
                    </div>
                    <Progress
                      value={recommendation.confidenceScore * 100}
                      color="brand"
                      mt="md"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InfoList
                      title={t("merge_reasons")}
                      values={recommendation.reasons}
                    />
                    <InfoList
                      title={t("merge_warnings")}
                      values={recommendation.warnings}
                      emptyLabel={t("merge_no_warnings")}
                      warning
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <ColumnList
                      title={t("merge_common_columns")}
                      columns={recommendation.commonColumns}
                    />
                    <ColumnList
                      title={t("merge_left_only_columns")}
                      columns={recommendation.leftOnlyColumns}
                    />
                    <ColumnList
                      title={t("merge_right_only_columns")}
                      columns={recommendation.rightOnlyColumns}
                    />
                  </div>

                  <div>
                    <Text weight={700} size="sm" mb="xs">
                      {t("merge_candidate_keys")}
                    </Text>
                    <div className="flex flex-wrap gap-2">
                      {recommendation.candidateKeys.length ? (
                        recommendation.candidateKeys.map((candidate) => (
                          <button
                            type="button"
                            key={candidate.columns.join("|")}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs hover:border-[#84BF43]"
                            onClick={() =>
                              updateConfiguration({
                                joinKeys: candidate.columns,
                              })
                            }
                          >
                            <span className="font-bold">
                              {candidate.columns.join(" + ")}
                            </span>
                            <span className="ml-2 text-gray-500">
                              {Math.round(candidate.overlapScore * 100)}%
                            </span>
                          </button>
                        ))
                      ) : (
                        <Text size="sm" color="dimmed">
                          {t("merge_no_candidate_keys")}
                        </Text>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <AppButton onClick={() => setActive(1)}>
                      {t("merge_configure")}
                    </AppButton>
                  </div>
                </>
              )}
            </div>
          )}

          {active === 1 && (
            <div className="space-y-5">
              <Select
                withAsterisk
                label={t("merge_operation")}
                data={operationOptions}
                value={configuration.operation}
                onChange={(value) =>
                  updateConfiguration({
                    operation: value as FileMergeOperation,
                    joinKeys:
                      value === "CONCAT_VERTICAL"
                        ? []
                        : configuration.joinKeys,
                  })
                }
              />

              <Divider label={t("merge_column_mapping")} labelPosition="left" />
              <Text size="xs" color="dimmed">
                {t("merge_column_mapping_help")}
              </Text>
              {mappingEntries.map(([source, target]) => (
                <div
                  key={source}
                  className="grid grid-cols-[1fr_1fr_auto] items-end gap-3"
                >
                  <Select
                    label={t("merge_source_column")}
                    data={allRightColumns}
                    value={source}
                    searchable
                    onChange={(value) =>
                      updateMapping(source, value || "", target)
                    }
                  />
                  <TextInput
                    label={t("merge_target_column")}
                    value={target}
                    onChange={(event) =>
                      updateMapping(source, source, event.currentTarget.value)
                    }
                  />
                  <AppButton
                    intent="ghost"
                    onClick={() => removeMapping(source)}
                    aria-label={t("merge_remove_mapping")}
                  >
                    <IconTrash size={16} />
                  </AppButton>
                </div>
              ))}
              <AppButton
                intent="ghost"
                leftIcon={<IconPlus size={15} />}
                onClick={addMapping}
                disabled={mappingEntries.length >= allRightColumns.length}
              >
                {t("merge_add_mapping")}
              </AppButton>

              {configuration.operation === "CONCAT_VERTICAL" && (
                <div className="rounded-xl border border-gray-200 p-4">
                  <Checkbox
                    label={t("merge_add_source_column")}
                    checked={configuration.addSourceColumn}
                    onChange={(event) =>
                      updateConfiguration({
                        addSourceColumn: event.currentTarget.checked,
                      })
                    }
                  />
                  {configuration.addSourceColumn && (
                    <TextInput
                      mt="sm"
                      label={t("merge_source_column_name")}
                      value={configuration.sourceColumnName}
                      onChange={(event) =>
                        updateConfiguration({
                          sourceColumnName: event.currentTarget.value,
                        })
                      }
                    />
                  )}
                </div>
              )}

              {["JOIN_BY_KEY", "UPSERT"].includes(
                configuration.operation || ""
              ) && (
                <MultiSelect
                  withAsterisk
                  searchable
                  label={t("merge_join_keys")}
                  data={availableJoinKeys}
                  value={configuration.joinKeys}
                  onChange={(joinKeys) => updateConfiguration({ joinKeys })}
                />
              )}

              {configuration.operation === "JOIN_BY_KEY" && (
                <Select
                  label={t("merge_join_type")}
                  data={[
                    { value: "inner", label: t("merge_join_inner") },
                    { value: "left", label: t("merge_join_left") },
                    { value: "outer", label: t("merge_join_outer") },
                  ]}
                  value={configuration.joinType}
                  onChange={(value) =>
                    updateConfiguration({
                      joinType: (value || "left") as MergeConfiguration["joinType"],
                    })
                  }
                />
              )}

              {configuration.operation === "UPSERT" && (
                <div className="space-y-3 rounded-xl border border-gray-200 p-4">
                  <Checkbox
                    label={t("merge_right_precedence")}
                    checked={configuration.rightPrecedence}
                    onChange={(event) =>
                      updateConfiguration({
                        rightPrecedence: event.currentTarget.checked,
                      })
                    }
                  />
                  <Checkbox
                    label={t("merge_update_non_null_only")}
                    checked={configuration.updateNonNullOnly}
                    onChange={(event) =>
                      updateConfiguration({
                        updateNonNullOnly: event.currentTarget.checked,
                      })
                    }
                  />
                </div>
              )}

              <NumberInput
                label={t("merge_preview_limit")}
                min={1}
                max={100}
                value={configuration.previewLimit}
                onChange={(value) =>
                  updateConfiguration({
                    previewLimit: Math.min(
                      100,
                      Math.max(1, Number(value) || 20)
                    ),
                  })
                }
              />

              <div className="flex justify-between gap-3">
                <AppButton intent="ghost" onClick={() => setActive(0)}>
                  {t("merge_back")}
                </AppButton>
                <AppButton loading={previewing} onClick={requestPreview}>
                  {t("merge_generate_preview")}
                </AppButton>
              </div>
            </div>
          )}

          {active === 2 && preview && (
            <div className="space-y-5">
              {(preview.warnings.length > 0 ||
                preview.typeConflicts.length > 0) && (
                <Alert color="yellow" title={t("merge_preview_warnings")}>
                  {[...preview.warnings, ...preview.typeConflicts.map(
                    (conflict) =>
                      `${conflict.column}: ${conflict.leftType} / ${conflict.rightType}`
                  )].join(" · ")}
                </Alert>
              )}

              <Statistics statistics={preview.statistics} t={t} />
              <FileMergePreviewTable preview={preview} />

              <TextInput
                withAsterisk
                label={t("merge_output_name")}
                description={t("merge_output_name_help")}
                maxLength={255}
                value={outputName}
                onChange={(event) => setOutputName(event.currentTarget.value)}
              />

              <div className="flex justify-between gap-3">
                <AppButton
                  intent="ghost"
                  onClick={() => {
                    invalidatePreview();
                    setActive(1);
                  }}
                >
                  {t("merge_edit_configuration")}
                </AppButton>
                <AppButton
                  onClick={confirmExecution}
                  disabled={!preview || !outputName.trim()}
                >
                  {t("merge_execute")}
                </AppButton>
              </div>
            </div>
          )}

          {active === 3 && createdFile && (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f3fadf] text-[#548828]">
                <IconCheck size={28} />
              </div>
              <Text weight={800} size="xl" mt="md">
                {t("merge_success_title")}
              </Text>
              <Text color="dimmed" size="sm" mt={4}>
                {t("merge_success_message", {
                  name: createdFile.name || outputName,
                })}
              </Text>
              <div className="mt-6 flex justify-center gap-3">
                <AppButton intent="ghost" onClick={onClose}>
                  {t("merge_close")}
                </AppButton>
                <AppButton onClick={() => onOpenFile(createdFile.id)}>
                  {t("merge_open_transformations")}
                </AppButton>
              </div>
            </div>
          )}
        </div>
      </AppModal>

      <ConfirmComponent
        opened={confirmOpened}
        onClose={() => setConfirmOpened(false)}
        title={t("merge_confirm_title")}
        description={t("merge_confirm_message", {
          name: outputName.trim(),
        })}
        confirmAction={runExecution}
        customConfirmProps={{
          buttonColor: "brand",
          buttonLabel: t("merge_confirm_action"),
        }}
      />
    </>
  );
}

function InfoList({
  title,
  values,
  emptyLabel,
  warning = false,
}: {
  title: string;
  values: string[];
  emptyLabel?: string;
  warning?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <Text weight={700} size="sm" mb="xs">
        {title}
      </Text>
      {values.length ? (
        <ul className="space-y-1 pl-4 text-sm text-gray-600">
          {values.map((value, index) => (
            <li
              key={`${value}-${index}`}
              className={warning ? "text-amber-700" : undefined}
            >
              {value}
            </li>
          ))}
        </ul>
      ) : (
        <Text size="sm" color="dimmed">
          {emptyLabel || "—"}
        </Text>
      )}
    </div>
  );
}

function ColumnList({
  title,
  columns,
}: {
  title: string;
  columns: string[];
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <Text weight={700} size="sm" mb="xs">
        {title}
      </Text>
      <div className="flex flex-wrap gap-1">
        {columns.length ? (
          columns.map((column) => (
            <Badge key={column} color="gray" variant="light">
              {column}
            </Badge>
          ))
        ) : (
          <Text size="sm" color="dimmed">
            —
          </Text>
        )}
      </div>
    </div>
  );
}

function Statistics({
  statistics,
  t,
}: {
  statistics: FileMergePreview["statistics"];
  t: (key: string, values?: Record<string, unknown>) => string;
}) {
  const items = [
    [t("merge_stat_left_rows"), statistics.leftRows],
    [t("merge_stat_right_rows"), statistics.rightRows],
    [t("merge_stat_result_rows"), statistics.resultRows],
    [t("merge_stat_matched_rows"), statistics.matchedLeftRows],
    [t("merge_stat_updated_rows"), statistics.updatedRows],
    [t("merge_stat_inserted_rows"), statistics.insertedRows],
  ].filter(([, value]) => value !== null && value !== undefined);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {items.map(([label, value]) => (
        <div
          key={String(label)}
          className="rounded-xl border border-gray-200 bg-gray-50 p-3"
        >
          <Text size="xs" color="dimmed">
            {label}
          </Text>
          <Text weight={800} size="lg">
            {value}
          </Text>
        </div>
      ))}
    </div>
  );
}
