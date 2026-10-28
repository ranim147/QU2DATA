import {
  ApolloError,
  useLazyQuery,
  useMutation,
  useQuery,
} from "@apollo/client";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "next-i18next";
import {
  APPLY_TRANSFORMATION,
  CANCEL_TRANSFORMATION,
  CREATE_DEDUPLICATION,
  CREATE_OUTLIER_TREATMENT,
  CREATE_TRANSFORMATION,
  EXECUTE_DEDUPLICATION,
  EXECUTE_OUTLIER_TREATMENT,
  PREVIEW_TRANSFORMATION,
} from "./mutation";
import {
  ANALYZE_DUPLICATES,
  ANALYZE_OUTLIERS,
  ANALYZE_LOG_TRANSFORM,
  GET_CURRENT_DATASET,
  GET_FILE_BY_ID,
  GET_PREVIEW_DATASET,
  GET_TRANSFORMATIONS_BY_FILE,
  RECOMMEND_TYPES,
} from "./query";
import {
  ApplyTransformationData,
  AnalyzeDuplicatesData,
  AnalyzeOutliersData,
  AnalyzeLogTransformData,
  CancelTransformationData,
  CreateTransformationData,
  DatasetResult,
  DeduplicationParameters,
  DeduplicationResult,
  DuplicateAnalysis,
  ExecuteDeduplicationData,
  ExecuteOutlierTreatmentData,
  GetDatasetData,
  GetFileByIdData,
  GetTransformationsByFileData,
  ImputationParameters,
  NormalizationParameters,
  OneHotEncodingParameters,
  LogTransformAnalysisResult,
  LogTransformParameters,
  BinningParameters,
  RecodeParameters,
  ConcatParameters,
  CalculateParameters,
  TypeCorrectionParameters,
  TypeCorrectionResult,
  TypeRecommendations,
  RecommendTypesData,
  OutlierAnalysisResult,
  OutlierParameters,
  OutlierTreatmentResult,
  PreviewTransformationData,
  StandardizationParameters,
  Transformation,
} from "./types";

type Action =
  | "preview"
  | "apply"
  | "cancel"
  | "analyze"
  | "deduplicate"
  | "standardize"
  | "normalize"
  | "encode"
  | "analyzeLog"
  | "transformLog"
  | "binning"
  | "recode"
  | "concat"
  | "calculate"
  | "recommendTypes"
  | "typeCorrection"
  | "confirmTypeCorrection"
  | "cancelTypeCorrection"
  | "analyzeOutliers"
  | "treatOutliers";

export interface PipelineFeedback {
  color: "green" | "red" | "yellow";
  message: string;
}

function apolloMessage(error?: ApolloError) {
  return error?.message?.trim() || "Une erreur GraphQL est survenue.";
}

export function useTransformationPipeline(fileId?: string) {
  const { t } = useTranslation("transformations");
  const enabled = Boolean(fileId);
  const [activeTransformation, setActiveTransformation] =
    useState<Transformation | null>(null);
  const [previewDataset, setPreviewDataset] =
    useState<DatasetResult | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const [feedback, setFeedback] = useState<PipelineFeedback | null>(null);
  const [duplicateAnalysis, setDuplicateAnalysis] =
    useState<DuplicateAnalysis | null>(null);
  const [deduplicationResult, setDeduplicationResult] =
    useState<DeduplicationResult | null>(null);
  const [outlierAnalysis, setOutlierAnalysis] =
    useState<OutlierAnalysisResult | null>(null);
  const [outlierTreatmentResult, setOutlierTreatmentResult] =
    useState<OutlierTreatmentResult | null>(null);
  const [normalizationRevision, setNormalizationRevision] = useState(0);
  const [encodingRevision, setEncodingRevision] = useState(0);
  const [logTransformAnalysis, setLogTransformAnalysis] =
    useState<LogTransformAnalysisResult | null>(null);
  const [logTransformRevision, setLogTransformRevision] = useState(0);
  const [binningRevision, setBinningRevision] = useState(0);
  const [recodeRevision, setRecodeRevision] = useState(0);
  const [concatRevision, setConcatRevision] = useState(0);
  const [calculateRevision, setCalculateRevision] = useState(0);
  const [typeRecommendations, setTypeRecommendations] = useState<TypeRecommendations | null>(null);
  const [typeCorrectionResult, setTypeCorrectionResult] = useState<TypeCorrectionResult | null>(null);
  const [typeCorrectionRevision, setTypeCorrectionRevision] = useState(0);
  const restoredPreviewId = useRef<string | null>(null);
  const actionLock = useRef(false);

  const fileQuery = useQuery<GetFileByIdData>(GET_FILE_BY_ID, {
    variables: { fileId },
    skip: !enabled,
  });

  const historyQuery = useQuery<GetTransformationsByFileData>(
    GET_TRANSFORMATIONS_BY_FILE,
    {
      variables: { fileId, page: 1, limit: 100 },
      skip: !enabled,
      fetchPolicy: "cache-and-network",
    }
  );

  const currentQuery = useQuery<GetDatasetData>(GET_CURRENT_DATASET, {
    variables: { fileId, limit: 10 },
    skip: !enabled,
    fetchPolicy: "network-only",
  });

  const [loadPreview, previewQuery] = useLazyQuery<GetDatasetData>(
    GET_PREVIEW_DATASET,
    { fetchPolicy: "network-only" }
  );

  const [createTransformation] =
    useMutation<CreateTransformationData>(CREATE_TRANSFORMATION);
  const [previewTransformation] =
    useMutation<PreviewTransformationData>(PREVIEW_TRANSFORMATION);
  const [applyTransformation] =
    useMutation<ApplyTransformationData>(APPLY_TRANSFORMATION);
  const [cancelTransformation] =
    useMutation<CancelTransformationData>(CANCEL_TRANSFORMATION);
  const [analyzeDuplicates] =
    useLazyQuery<AnalyzeDuplicatesData>(ANALYZE_DUPLICATES, {
      fetchPolicy: "network-only",
    });
  const [createDeduplication] =
    useMutation<CreateTransformationData>(CREATE_DEDUPLICATION);
  const [executeDeduplication] =
    useMutation<ExecuteDeduplicationData>(EXECUTE_DEDUPLICATION);
  const [analyzeOutliers] = useLazyQuery<AnalyzeOutliersData>(ANALYZE_OUTLIERS, {
    fetchPolicy: "network-only",
  });
  const [analyzeLog] = useLazyQuery<AnalyzeLogTransformData>(
    ANALYZE_LOG_TRANSFORM,
    { fetchPolicy: "network-only" }
  );
  const [recommendTypeQuery] = useLazyQuery<RecommendTypesData>(RECOMMEND_TYPES, { fetchPolicy: "no-cache" });
  const [createOutlierTreatment] =
    useMutation<CreateTransformationData>(CREATE_OUTLIER_TREATMENT);
  const [executeOutlierTreatment] =
    useMutation<ExecuteOutlierTreatmentData>(EXECUTE_OUTLIER_TREATMENT);

  const history = historyQuery.data?.getTransformationsByFile.rows ?? [];
  const currentDataset = currentQuery.data?.getCurrentDataset ?? null;
  const fileResponse = fileQuery.data?.getFileById;

  const refetchHistory = async (): Promise<void> => {
    if (!fileId) return;
    await historyQuery.refetch({ fileId, page: 1, limit: 100 });
  };

  useEffect(() => {
    setDuplicateAnalysis(null);
    setDeduplicationResult(null);
    setOutlierAnalysis(null);
    setOutlierTreatmentResult(null);
  }, [fileId]);

  useEffect(() => {
    if (!activeTransformation && history.length > 0) {
      setActiveTransformation(history[0]);
    }
  }, [activeTransformation, history]);

  useEffect(() => {
    if (
      !fileId ||
      action ||
      activeTransformation?.status !== "PREVIEWED" ||
      restoredPreviewId.current === activeTransformation.id
    ) {
      return;
    }

    restoredPreviewId.current = activeTransformation.id;
    loadPreview({ variables: { fileId, limit: 10 } })
      .then(({ data }) => {
        const result = data?.getPreviewDataset;
        if (result?.success) {
          setPreviewDataset(result);
          setPreviewVisible(true);
        } else {
          setPreviewDataset(null);
          setPreviewVisible(false);
          setFeedback({
            color: "yellow",
            message: result?.message || "PREVIEW NOT FOUND",
          });
        }
      })
      .catch((error: ApolloError) => {
        setFeedback({ color: "red", message: apolloMessage(error) });
      });
  }, [action, activeTransformation, fileId, loadPreview]);

  const preview = async (parameters: ImputationParameters) => {
    if (!fileId || action || actionLock.current) return;

    actionLock.current = true;
    setAction("preview");
    setFeedback(null);
    setPreviewVisible(false);
    setPreviewDataset(null);

    try {
      const created = await createTransformation({
        variables: {
          name: `Imputation - ${parameters.method}`,
          type: "IMPUTATION",
          parameters,
          fileId,
        },
      });
      const createResult = created.data?.createTransformation;

      if (!createResult?.success || !createResult.transformation?.id) {
        throw new Error(
          createResult?.message || "La transformation n'a pas pu être créée."
        );
      }

      setActiveTransformation(createResult.transformation);

      const previewed = await previewTransformation({
        variables: { transformationId: createResult.transformation.id },
      });
      const previewResult = previewed.data?.previewTransformation;

      if (!previewResult?.success || !previewResult.transformation) {
        if (previewResult?.transformation) {
          setActiveTransformation(previewResult.transformation);
        }
        throw new Error(
          previewResult?.message || "La prévisualisation a échoué."
        );
      }

      restoredPreviewId.current = previewResult.transformation.id;
      setActiveTransformation(previewResult.transformation);

      const [currentResponse, previewResponse] = await Promise.all([
        currentQuery.refetch({ fileId, limit: 10 }),
        loadPreview({ variables: { fileId, limit: 10 } }),
      ]);

      const currentResult = currentResponse.data?.getCurrentDataset;
      const datasetPreview = previewResponse.data?.getPreviewDataset;

      if (!currentResult?.success) {
        throw new Error(
          currentResult?.message || "Le dataset courant n'a pas pu être chargé."
        );
      }

      if (!datasetPreview?.success) {
        throw new Error(datasetPreview?.message || "PREVIEW NOT FOUND");
      }

      setPreviewDataset(datasetPreview);
      setPreviewVisible(true);
      setFeedback({
        color: "green",
        message: previewResult.message || "Prévisualisation créée.",
      });
    } catch (error) {
      setFeedback({
        color: "red",
        message:
          error instanceof Error && error.message.trim()
            ? error.message
            : "La prévisualisation a échoué.",
      });
    } finally {
      await historyQuery.refetch().catch(() => undefined);
      actionLock.current = false;
      setAction(null);
    }
  };

  const apply = async () => {
    if (
      !fileId ||
      action ||
      actionLock.current ||
      !activeTransformation ||
      activeTransformation.status !== "PREVIEWED"
    ) {
      return;
    }

    actionLock.current = true;
    setAction("apply");
    setFeedback(null);

    try {
      const response = await applyTransformation({
        variables: { transformationId: activeTransformation.id },
      });
      const result = response.data?.applyTransformation;

      if (!result?.success || !result.transformation) {
        if (result?.transformation) setActiveTransformation(result.transformation);
        throw new Error(result?.message || "L'application a échoué.");
      }

      setActiveTransformation(result.transformation);
      setPreviewDataset(null);
      setPreviewVisible(false);
      await Promise.all([
        currentQuery.refetch({ fileId, limit: 10 }),
        historyQuery.refetch(),
      ]);
      setFeedback({
        color: "green",
        message: result.message || "Transformation appliquée.",
      });
    } catch (error) {
      setFeedback({
        color: "red",
        message:
          error instanceof Error && error.message.trim()
            ? error.message
            : "L'application a échoué.",
      });
      await historyQuery.refetch();
    } finally {
      actionLock.current = false;
      setAction(null);
    }
  };

  const cancel = async () => {
    if (
      action ||
      actionLock.current ||
      !activeTransformation ||
      activeTransformation.status !== "PREVIEWED"
    ) {
      return;
    }

    actionLock.current = true;
    setAction("cancel");
    setFeedback(null);

    try {
      const response = await cancelTransformation({
        variables: { transformationId: activeTransformation.id },
      });
      const result = response.data?.cancelTransformation;

      if (!result?.success || !result.transformation) {
        if (result?.transformation) setActiveTransformation(result.transformation);
        throw new Error(result?.message || "L'annulation a échoué.");
      }

      setActiveTransformation(result.transformation);
      setPreviewDataset(null);
      setPreviewVisible(false);
      await historyQuery.refetch();
      setFeedback({
        color: "green",
        message: result.message || "Transformation annulée.",
      });
    } catch (error) {
      setFeedback({
        color: "red",
        message:
          error instanceof Error && error.message.trim()
            ? error.message
            : "L'annulation a échoué.",
      });
      await historyQuery.refetch();
    } finally {
      actionLock.current = false;
      setAction(null);
    }
  };

  const analyzeDeduplication = async (parameters: DeduplicationParameters) => {
    if (!fileId || action || actionLock.current || parameters.subset.length === 0) {
      return;
    }

    actionLock.current = true;
    setAction("analyze");
    setFeedback(null);
    setDuplicateAnalysis(null);
    setDeduplicationResult(null);

    try {
      const response = await analyzeDuplicates({
        variables: { fileId, subset: parameters.subset },
      });
      const result = response.data?.analyzeDuplicates;
      if (!result?.success || !result.data) {
        throw new Error(result?.message || "L'analyse des doublons a échoué.");
      }

      setDuplicateAnalysis(result.data);
      if (result.data.duplicateCount === 0) {
        setFeedback({ color: "yellow", message: "Aucun doublon détecté pour cette clé." });
      }
    } catch (error) {
      setFeedback({
        color: "red",
        message:
          error instanceof Error && error.message.trim()
            ? error.message
            : "L'analyse des doublons a échoué.",
      });
    } finally {
      actionLock.current = false;
      setAction(null);
    }
  };

  const runDeduplication = async (parameters: DeduplicationParameters) => {
    if (
      !fileId ||
      action ||
      actionLock.current ||
      parameters.subset.length === 0 ||
      !duplicateAnalysis ||
      duplicateAnalysis.duplicateCount === 0
    ) {
      return;
    }

    actionLock.current = true;
    setAction("deduplicate");
    setFeedback(null);
    setDeduplicationResult(null);

    try {
      const normalizedParameters: DeduplicationParameters = {
        subset: Array.from(new Set(parameters.subset)),
        keep: parameters.keep,
        preview: true,
      };
      const created = await createDeduplication({
        variables: {
          name: `Dédupliquer - ${normalizedParameters.subset.join(" + ")}`,
          type: "DEDUPLICATION",
          parameters: normalizedParameters,
          fileId,
        },
      });
      const createResult = created.data?.createTransformation;
      if (!createResult?.success || !createResult.transformation?.id) {
        throw new Error(
          createResult?.message || "La transformation n'a pas pu être créée."
        );
      }

      setActiveTransformation(createResult.transformation);
      const executed = await executeDeduplication({
        variables: { transformationId: createResult.transformation.id },
      });
      const executionResult = executed.data?.previewTransformation;
      if (
        !executionResult?.success ||
        executionResult.transformation?.status !== "APPLIED" ||
        !executionResult.deduplicationResult
      ) {
        if (executionResult?.transformation) {
          setActiveTransformation(executionResult.transformation);
        }
        throw new Error(
          executionResult?.message || "La déduplication a échoué."
        );
      }

      setActiveTransformation(executionResult.transformation);
      setDeduplicationResult(executionResult.deduplicationResult);
      setDuplicateAnalysis(null);
      await Promise.all([
        currentQuery.refetch({ fileId, limit: 10 }),
        historyQuery.refetch(),
      ]);
      setFeedback({
        color: "green",
        message:
          executionResult.message ||
          `${executionResult.deduplicationResult.rowsRemoved} doublon(s) supprimé(s).`,
      });
    } catch (error) {
      setFeedback({
        color: "red",
        message:
          error instanceof Error && error.message.trim()
            ? error.message
            : "La déduplication a échoué.",
      });
      await historyQuery.refetch().catch(() => undefined);
    } finally {
      actionLock.current = false;
      setAction(null);
    }
  };

  const runStandardization = async (parameters: StandardizationParameters) => {
    if (!fileId || action || actionLock.current || parameters.columns.length === 0) {
      return;
    }

    actionLock.current = true;
    setAction("standardize");
    setFeedback(null);

    try {
      const normalizedParameters: StandardizationParameters = {
        columns: Array.from(new Set(parameters.columns)),
        method: parameters.method,
        preview_limit: parameters.preview_limit ?? 10,
      };
      const created = await createTransformation({
        variables: {
          name: `${t("standardization.historyName")} - ${normalizedParameters.method}`,
          type: "STANDARDIZATION",
          parameters: normalizedParameters,
          fileId,
        },
      });
      const createResult = created.data?.createTransformation;
      if (!createResult?.success || !createResult.transformation?.id) {
        throw new Error(
          createResult?.message || t("standardization.errors.create")
        );
      }

      setActiveTransformation(createResult.transformation);
      const executed = await previewTransformation({
        variables: { transformationId: createResult.transformation.id },
      });
      const executionResult = executed.data?.previewTransformation;
      if (
        !executionResult?.success ||
        executionResult.transformation?.status !== "APPLIED"
      ) {
        if (executionResult?.transformation) {
          setActiveTransformation(executionResult.transformation);
        }
        throw new Error(
          executionResult?.message || t("standardization.errors.execute")
        );
      }

      setActiveTransformation(executionResult.transformation);
      setPreviewDataset(null);
      setPreviewVisible(false);
      await Promise.all([
        currentQuery.refetch({ fileId, limit: 10 }),
        historyQuery.refetch(),
      ]);
      setFeedback({
        color: "green",
        message: executionResult.message || t("standardization.success"),
      });
    } catch (error) {
      setFeedback({
        color: "red",
        message:
          error instanceof Error && error.message.trim()
            ? error.message
            : t("standardization.errors.execute"),
      });
      await historyQuery.refetch().catch(() => undefined);
    } finally {
      actionLock.current = false;
      setAction(null);
    }
  };

  const runNormalization = async (parameters: NormalizationParameters) => {
    if (!fileId || action || actionLock.current || parameters.columns.length === 0) {
      return;
    }

    actionLock.current = true;
    setAction("normalize");
    setFeedback(null);

    try {
      const normalizedParameters: NormalizationParameters = {
        columns: Array.from(new Set(parameters.columns)),
        preview_limit: parameters.preview_limit ?? 10,
      };
      const created = await createTransformation({
        variables: {
          name: t("normalization.historyName"),
          type: "NORMALIZATION",
          parameters: normalizedParameters,
          fileId,
        },
      });
      const createResult = created.data?.createTransformation;
      if (!createResult?.success || !createResult.transformation?.id) {
        throw new Error(
          createResult?.message || t("normalization.errors.create")
        );
      }

      setActiveTransformation(createResult.transformation);
      const executed = await previewTransformation({
        variables: { transformationId: createResult.transformation.id },
      });
      const executionResult = executed.data?.previewTransformation;
      if (
        !executionResult?.success ||
        executionResult.transformation?.status !== "APPLIED"
      ) {
        if (executionResult?.transformation) {
          setActiveTransformation(executionResult.transformation);
        }
        throw new Error(
          executionResult?.message || t("normalization.errors.execute")
        );
      }

      setActiveTransformation(executionResult.transformation);
      setPreviewDataset(null);
      setPreviewVisible(false);
      await Promise.all([
        currentQuery.refetch({ fileId, limit: 10 }),
        historyQuery.refetch(),
      ]);
      setNormalizationRevision((revision) => revision + 1);
      setFeedback({
        color: "green",
        message: executionResult.message || t("normalization.success"),
      });
    } catch (error) {
      setFeedback({
        color: "red",
        message:
          error instanceof Error && error.message.trim()
            ? error.message
            : t("normalization.errors.execute"),
      });
      await historyQuery.refetch().catch(() => undefined);
    } finally {
      actionLock.current = false;
      setAction(null);
    }
  };

  const runOneHotEncoding = async (parameters: OneHotEncodingParameters) => {
    if (!fileId || action || actionLock.current || parameters.columns.length === 0) {
      return;
    }

    actionLock.current = true;
    setAction("encode");
    setFeedback(null);

    try {
      const encodingParameters: OneHotEncodingParameters = {
        columns: Array.from(new Set(parameters.columns)),
        drop_first: parameters.drop_first ?? false,
        drop_original: parameters.drop_original ?? true,
        preview_limit: parameters.preview_limit ?? 10,
      };
      const created = await createTransformation({
        variables: {
          name: t("encoding.historyName"),
          type: "ONE_HOT_ENCODING",
          parameters: encodingParameters,
          fileId,
        },
      });
      const createResult = created.data?.createTransformation;
      if (!createResult?.success || !createResult.transformation?.id) {
        throw new Error(createResult?.message || t("encoding.errors.create"));
      }

      setActiveTransformation(createResult.transformation);
      const executed = await previewTransformation({
        variables: { transformationId: createResult.transformation.id },
      });
      const executionResult = executed.data?.previewTransformation;
      if (
        !executionResult?.success ||
        executionResult.transformation?.status !== "APPLIED"
      ) {
        if (executionResult?.transformation) {
          setActiveTransformation(executionResult.transformation);
        }
        throw new Error(
          executionResult?.message || t("encoding.errors.execute")
        );
      }

      setActiveTransformation(executionResult.transformation);
      setPreviewDataset(null);
      setPreviewVisible(false);
      await Promise.all([
        currentQuery.refetch({ fileId, limit: 10 }),
        historyQuery.refetch(),
      ]);
      setEncodingRevision((revision) => revision + 1);
      setFeedback({
        color: "green",
        message: executionResult.message || t("encoding.success"),
      });
    } catch (error) {
      setFeedback({
        color: "red",
        message:
          error instanceof Error && error.message.trim()
            ? error.message
            : t("encoding.errors.execute"),
      });
      await historyQuery.refetch().catch(() => undefined);
    } finally {
      actionLock.current = false;
      setAction(null);
    }
  };

  const analyzeLogTransformation = async (parameters: LogTransformParameters) => {
    if (!fileId || action || actionLock.current || parameters.columns.length === 0) {
      return null;
    }
    actionLock.current = true;
    setAction("analyzeLog");
    setFeedback(null);
    setLogTransformAnalysis(null);
    try {
      const response = await analyzeLog({
        variables: {
          fileId,
          columns: Array.from(new Set(parameters.columns)),
          method: parameters.method,
        },
      });
      const result = response.data?.analyzeLogTransform;
      if (!result?.success || !result.data) {
        throw new Error(result?.message || t("logTransform.errors.analyze"));
      }
      setLogTransformAnalysis(result.data);
      return result.data;
    } catch (error) {
      setFeedback({
        color: "red",
        message:
          error instanceof Error && error.message.trim()
            ? error.message
            : t("logTransform.errors.analyze"),
      });
      return null;
    } finally {
      actionLock.current = false;
      setAction(null);
    }
  };

  const runLogTransformation = async (parameters: LogTransformParameters) => {
    const columns = Array.from(new Set(parameters.columns));
    const allEligible =
      columns.length > 0 &&
      columns.every((column) => logTransformAnalysis?.results[column]?.eligible);
    if (!fileId || action || actionLock.current || !allEligible) return;

    actionLock.current = true;
    setAction("transformLog");
    setFeedback(null);
    try {
      const logParameters: LogTransformParameters = {
        columns,
        method: parameters.method,
        action: parameters.action,
      };
      const created = await createTransformation({
        variables: {
          name: `${t("logTransform.historyName")} - ${parameters.method}`,
          type: "LOG_TRANSFORM",
          parameters: logParameters,
          fileId,
        },
      });
      const createResult = created.data?.createTransformation;
      if (!createResult?.success || !createResult.transformation?.id) {
        throw new Error(createResult?.message || t("logTransform.errors.create"));
      }
      setActiveTransformation(createResult.transformation);

      const executed = await previewTransformation({
        variables: { transformationId: createResult.transformation.id },
      });
      const executionResult = executed.data?.previewTransformation;
      if (
        !executionResult?.success ||
        executionResult.transformation?.status !== "APPLIED"
      ) {
        if (executionResult?.transformation) {
          setActiveTransformation(executionResult.transformation);
        }
        throw new Error(executionResult?.message || t("logTransform.errors.execute"));
      }

      setActiveTransformation(executionResult.transformation);
      setPreviewDataset(null);
      setPreviewVisible(false);
      setLogTransformAnalysis(null);
      await Promise.all([
        currentQuery.refetch({ fileId, limit: 10 }),
        historyQuery.refetch(),
      ]);
      setLogTransformRevision((revision) => revision + 1);
      setFeedback({
        color: "green",
        message: executionResult.message || t("logTransform.success"),
      });
    } catch (error) {
      setFeedback({
        color: "red",
        message:
          error instanceof Error && error.message.trim()
            ? error.message
            : t("logTransform.errors.execute"),
      });
      await historyQuery.refetch().catch(() => undefined);
    } finally {
      actionLock.current = false;
      setAction(null);
    }
  };

  const runAutomaticColumnTransform = async (
    type: "BINNING_COLUMN" | "RECODE_COLUMN" | "CONCAT_COLUMNS" | "CALCULATE_COLUMN",
    parameters: BinningParameters | RecodeParameters | ConcatParameters | CalculateParameters
  ) => {
    if (!fileId || action || actionLock.current) return;
    const key = type === "BINNING_COLUMN" ? "binning" : type === "RECODE_COLUMN" ? "recode" : type === "CONCAT_COLUMNS" ? "concat" : "calculate";
    actionLock.current = true;
    setAction(key);
    setFeedback(null);
    try {
      const created = await createTransformation({
        variables: {
          name: t(`${key}.historyName`),
          type,
          parameters,
          fileId,
        },
      });
      const createResult = created.data?.createTransformation;
      if (!createResult?.success || !createResult.transformation?.id) {
        throw new Error(
          createResult?.message ||
            t(`${key}.errors.create`)
        );
      }
      setActiveTransformation(createResult.transformation);
      const executed = await previewTransformation({
        variables: { transformationId: createResult.transformation.id },
      });
      const executionResult = executed.data?.previewTransformation;
      if (
        !executionResult?.success ||
        executionResult.transformation?.status !== "APPLIED"
      ) {
        if (executionResult?.transformation) {
          setActiveTransformation(executionResult.transformation);
        }
        throw new Error(
          executionResult?.message ||
            t(`${key}.errors.execute`)
        );
      }
      setActiveTransformation(executionResult.transformation);
      await Promise.all([
        currentQuery.refetch({ fileId, limit: 10 }),
        historyQuery.refetch(),
      ]);
      if (key === "binning") setBinningRevision((revision) => revision + 1);
      else if (key === "recode") setRecodeRevision((revision) => revision + 1);
      else if (key === "concat") setConcatRevision((revision) => revision + 1);
      else setCalculateRevision((revision) => revision + 1);
      setFeedback({
        color: "green",
        message:
          executionResult.message ||
          t(`${key}.success`),
      });
    } catch (error) {
      setFeedback({
        color: "red",
        message:
          error instanceof Error && error.message.trim()
            ? error.message
            : t(`${key}.errors.execute`),
      });
      await historyQuery.refetch().catch(() => undefined);
    } finally {
      actionLock.current = false;
      setAction(null);
    }
  };

  const fetchTypeRecommendations = async () => {
    if (!fileId) return null;
    const response = await recommendTypeQuery({ variables: { fileId } });
    const result = response.data?.recommendTypes;
    if (!result?.success || !result.data) throw new Error(result?.message || t("typeCorrection.recommendationError"));
    setTypeRecommendations(result.data);
    return result.data;
  };

  const loadTypeRecommendations = async () => {
    if (!fileId || action || actionLock.current) return;
    actionLock.current = true; setAction("recommendTypes"); setFeedback(null);
    try { await fetchTypeRecommendations(); }
    catch (error) { setTypeRecommendations(null); setFeedback({ color: "red", message: error instanceof Error ? error.message : t("typeCorrection.recommendationError") }); }
    finally { actionLock.current = false; setAction(null); }
  };

  const runTypeCorrection = async (parameters: TypeCorrectionParameters) => {
    if (!fileId || action || actionLock.current) return;
    actionLock.current = true; setAction("typeCorrection"); setFeedback(null); setTypeCorrectionResult(null);
    try {
      const created = await createTransformation({ variables: { name: t("typeCorrection.historyName"), type: "TYPE_CORRECTION", parameters, fileId } });
      const createResult = created.data?.createTransformation;
      if (!createResult?.success || !createResult.transformation?.id) throw new Error(createResult?.message || t("typeCorrection.conversionError"));
      setActiveTransformation(createResult.transformation);
      const executed = await previewTransformation({ variables: { transformationId: createResult.transformation.id } });
      const result = executed.data?.previewTransformation;
      if (!result?.success || !result.transformation || !result.typeCorrectionResult) throw new Error(result?.message || t("typeCorrection.conversionError"));
      setActiveTransformation(result.transformation); setTypeCorrectionResult(result.typeCorrectionResult);
      if (result.transformation.status === "APPLIED") {
        await Promise.all([currentQuery.refetch({ fileId, limit: 10 }), historyQuery.refetch(), fetchTypeRecommendations()]);
        setTypeCorrectionResult(null); setTypeCorrectionRevision((value) => value + 1); setFeedback({ color: "green", message: t("typeCorrection.success") });
      } else if (result.transformation.status === "PREVIEWED" && result.typeCorrectionResult.requiresConfirmation) {
        await historyQuery.refetch();
      } else throw new Error(result.message || t("typeCorrection.conversionError"));
    } catch (error) { setFeedback({ color: "red", message: error instanceof Error ? error.message : t("typeCorrection.conversionError") }); await historyQuery.refetch().catch(() => undefined); }
    finally { actionLock.current = false; setAction(null); }
  };

  const confirmTypeCorrection = async () => {
    if (!fileId || action || actionLock.current || activeTransformation?.type !== "TYPE_CORRECTION" || activeTransformation.status !== "PREVIEWED") return;
    actionLock.current = true; setAction("confirmTypeCorrection"); setFeedback(null);
    try { const response = await applyTransformation({ variables: { transformationId: activeTransformation.id } }); const result = response.data?.applyTransformation; if (!result?.success || result.transformation?.status !== "APPLIED") throw new Error(result?.message || t("typeCorrection.conversionError")); setActiveTransformation(result.transformation); setTypeCorrectionResult(null); await Promise.all([currentQuery.refetch({ fileId, limit: 10 }), historyQuery.refetch(), fetchTypeRecommendations()]); setTypeCorrectionRevision((value) => value + 1); setFeedback({ color: "green", message: t("typeCorrection.success") }); }
    catch (error) { setFeedback({ color: "red", message: error instanceof Error ? error.message : t("typeCorrection.conversionError") }); }
    finally { actionLock.current = false; setAction(null); }
  };

  const cancelTypeCorrection = async () => {
    if (action || actionLock.current || activeTransformation?.type !== "TYPE_CORRECTION" || activeTransformation.status !== "PREVIEWED") return;
    actionLock.current = true; setAction("cancelTypeCorrection"); setFeedback(null);
    try { const response = await cancelTransformation({ variables: { transformationId: activeTransformation.id } }); const result = response.data?.cancelTransformation; if (!result?.success) throw new Error(result?.message || t("typeCorrection.conversionError")); if (result.transformation) setActiveTransformation(result.transformation); setTypeCorrectionResult(null); await Promise.all([historyQuery.refetch(), fetchTypeRecommendations()]); setTypeCorrectionRevision((value) => value + 1); }
    catch (error) { setFeedback({ color: "red", message: error instanceof Error ? error.message : t("typeCorrection.conversionError") }); }
    finally { actionLock.current = false; setAction(null); }
  };

  const analyzeOutlierValues = async (
    parameters: OutlierParameters
  ): Promise<OutlierAnalysisResult | null> => {
    if (!fileId || action || actionLock.current || !parameters.column) return null;

    actionLock.current = true;
    setAction("analyzeOutliers");
    setFeedback(null);
    setOutlierAnalysis(null);
    setOutlierTreatmentResult(null);

    try {
      const response = await analyzeOutliers({
        variables: {
          fileId,
          columns: [parameters.column],
          method: parameters.method,
          factor: parameters.factor,
        },
      });
      const result = response.data?.analyzeOutliers;
      if (!result?.success || !result.data) {
        throw new Error(result?.message || "L'analyse des valeurs aberrantes a échoué.");
      }

      setOutlierAnalysis(result.data);
      const count = result.data.results[parameters.column]?.outlier_count;
      if (typeof count === "number" && count === 0) {
        setFeedback({ color: "yellow", message: "Aucune valeur aberrante détectée." });
      }
      return result.data;
    } catch (error) {
      setFeedback({
        color: "red",
        message:
          error instanceof Error && error.message.trim()
            ? error.message
            : "L'analyse des valeurs aberrantes a échoué.",
      });
      return null;
    } finally {
      actionLock.current = false;
      setAction(null);
    }
  };

  const runOutlierTreatment = async (parameters: OutlierParameters) => {
    const analysis = outlierAnalysis?.results[parameters.column];
    if (
      !fileId ||
      action ||
      actionLock.current ||
      !parameters.column ||
      typeof analysis?.outlier_count !== "number" ||
      analysis.outlier_count <= 0
    ) {
      return;
    }

    actionLock.current = true;
    setAction("treatOutliers");
    setFeedback(null);
    setOutlierTreatmentResult(null);

    try {
      const normalizedParameters: OutlierParameters = {
        ...parameters,
        column: parameters.column.trim(),
        preview: true,
      };
      const created = await createOutlierTreatment({
        variables: {
          name: `Traiter les valeurs aberrantes - ${normalizedParameters.column}`,
          type: "OUTLIER_TREATMENT",
          parameters: normalizedParameters,
          fileId,
        },
      });
      const createResult = created.data?.createTransformation;
      if (!createResult?.success || !createResult.transformation?.id) {
        throw new Error(
          createResult?.message || "La transformation n'a pas pu être créée."
        );
      }

      setActiveTransformation(createResult.transformation);
      const executed = await executeOutlierTreatment({
        variables: { transformationId: createResult.transformation.id },
      });
      const executionResult = executed.data?.previewTransformation;
      if (
        !executionResult?.success ||
        executionResult.transformation?.status !== "APPLIED" ||
        !executionResult.outlierTreatmentResult
      ) {
        if (executionResult?.transformation) {
          setActiveTransformation(executionResult.transformation);
        }
        throw new Error(
          executionResult?.message || "Le traitement des valeurs aberrantes a échoué."
        );
      }

      setActiveTransformation(executionResult.transformation);
      setOutlierTreatmentResult(executionResult.outlierTreatmentResult);
      setOutlierAnalysis(null);
      await Promise.all([
        currentQuery.refetch({ fileId, limit: 10 }),
        historyQuery.refetch(),
      ]);
      setFeedback({
        color: "green",
        message:
          executionResult.message ||
          `${executionResult.outlierTreatmentResult.outliersTreated} valeur(s) aberrante(s) traitée(s).`,
      });
    } catch (error) {
      setFeedback({
        color: "red",
        message:
          error instanceof Error && error.message.trim()
            ? error.message
            : "Le traitement des valeurs aberrantes a échoué.",
      });
      await historyQuery.refetch().catch(() => undefined);
    } finally {
      actionLock.current = false;
      setAction(null);
    }
  };

  const queryError =
    fileQuery.error || historyQuery.error || currentQuery.error || previewQuery.error;
  const businessError =
    (fileResponse && !fileResponse.success && fileResponse.message) ||
    (currentDataset && !currentDataset.success && currentDataset.message) ||
    null;

  return {
    fileName: fileResponse?.success ? fileResponse.file?.name : null,
    history,
    historyCount: historyQuery.data?.getTransformationsByFile.count ?? 0,
    refetchHistory,
    currentDataset:
      currentDataset?.success === true ? currentDataset : null,
    previewDataset,
    previewVisible,
    activeTransformation,
    duplicateAnalysis,
    deduplicationResult,
    outlierAnalysis,
    outlierTreatmentResult,
    action,
    feedback,
    loading:
      fileQuery.loading || historyQuery.loading || currentQuery.loading,
    error: queryError ? apolloMessage(queryError) : businessError,
    preview,
    apply,
    cancel,
    analyzeDeduplication,
    runDeduplication,
    runStandardization,
    runNormalization,
    normalizationRevision,
    runOneHotEncoding,
    encodingRevision,
    logTransformAnalysis,
    logTransformRevision,
    analyzeLogTransformation,
    runLogTransformation,
    resetLogTransformation: () => setLogTransformAnalysis(null),
    runBinning: (parameters: BinningParameters) =>
      runAutomaticColumnTransform("BINNING_COLUMN", parameters),
    runRecode: (parameters: RecodeParameters) =>
      runAutomaticColumnTransform("RECODE_COLUMN", parameters),
    runConcat: (parameters: ConcatParameters) => runAutomaticColumnTransform("CONCAT_COLUMNS", parameters),
    runCalculate: (parameters: CalculateParameters) => runAutomaticColumnTransform("CALCULATE_COLUMN", parameters),
    binningRevision,
    recodeRevision,
    concatRevision,
    calculateRevision,
    typeRecommendations,
    typeCorrectionResult,
    typeCorrectionRevision,
    loadTypeRecommendations,
    runTypeCorrection,
    confirmTypeCorrection,
    cancelTypeCorrection,
    analyzeOutlierValues,
    runOutlierTreatment,
    resetDeduplication: () => {
      setDuplicateAnalysis(null);
      setDeduplicationResult(null);
    },
    resetOutliers: () => {
      setOutlierAnalysis(null);
      setOutlierTreatmentResult(null);
    },
    dismissFeedback: () => setFeedback(null),
  };
}
