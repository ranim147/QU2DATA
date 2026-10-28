import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Alert, Stack, Text } from "@mantine/core";
import { useTranslation } from "next-i18next";
import ConfirmComponent from "../../layout/confirmComponent";
import { Card } from "../../ui";
import BootstrapSamplingForm from "./BootstrapSamplingForm";
import QuotaSamplingForm from "./QuotaSamplingForm";
import SamplingMethodSelector from "./SamplingMethodSelector";
import SamplingResultView from "./SamplingResult";
import SamplingSizeCalculator from "./SamplingSizeCalculator";
import SimpleRandomSamplingForm from "./SimpleRandomSamplingForm";
import StratifiedSamplingForm from "./StratifiedSamplingForm";
import SystematicSamplingForm from "./SystematicSamplingForm";
import {
  EXECUTE_BOOTSTRAP_SAMPLING,
  EXECUTE_QUOTA_SAMPLING,
  EXECUTE_SIMPLE_RANDOM_SAMPLING,
  EXECUTE_STRATIFIED_SAMPLING,
  EXECUTE_SYSTEMATIC_SAMPLING,
  GET_SAMPLING_COLUMNS,
  GET_SAMPLING_FILE,
} from "./operations";
import {
  BootstrapSamplingInput,
  BootstrapSamplingResult,
  QuotaSamplingInput,
  QuotaSamplingResult,
  SamplingMethod,
  SamplingMutationResponse,
  SamplingResult,
  SimpleRandomSamplingInput,
  SimpleRandomSamplingResult,
  StratifiedSamplingInput,
  StratifiedSamplingResult,
  SystematicSamplingInput,
  SystematicSamplingResult,
} from "./types";

type PendingExecution = {
  method: SamplingMethod;
  input: Record<string, unknown>;
};

interface ColumnsData {
  getCurrentDataset?: {
    success: boolean;
    message: string;
    columns: string[];
    rowCount: number;
  };
}

interface FileData {
  getFiles: { rows: Array<{ id: string; name: string }> };
}

export default function SamplingWorkspace({
  fileId,
  projectId,
}: {
  fileId: string;
  projectId: string;
}) {
  const { t } = useTranslation("sampling");
  const [method, setMethod] = useState<SamplingMethod>("simpleRandom");
  const [pending, setPending] = useState<PendingExecution | null>(null);
  const [result, setResult] = useState<SamplingResult | null>(null);
  const [resultMethod, setResultMethod] = useState<SamplingMethod>("simpleRandom");
  const [suggestedSize, setSuggestedSize] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{color:"green"|"red";message:string}|null>(null);
  const columnsQuery = useQuery<ColumnsData>(GET_SAMPLING_COLUMNS, {
    variables: { fileId },
    fetchPolicy: "cache-and-network",
  });
  const fileQuery = useQuery<FileData>(GET_SAMPLING_FILE, {
    variables: { filter: { projectId, id: fileId } },
  });
  const fileName = fileQuery.data?.getFiles.rows[0]?.name;
  const columns = columnsQuery.data?.getCurrentDataset?.columns ?? [];

  const [simple, simpleState] = useMutation<
    { executeSimpleRandomSampling: SamplingMutationResponse<SimpleRandomSamplingResult> },
    { input: SimpleRandomSamplingInput }
  >(EXECUTE_SIMPLE_RANDOM_SAMPLING);
  const [systematic, systematicState] = useMutation<
    { executeSystematicSampling: SamplingMutationResponse<SystematicSamplingResult> },
    { input: SystematicSamplingInput }
  >(EXECUTE_SYSTEMATIC_SAMPLING);
  const [bootstrap, bootstrapState] = useMutation<
    { executeBootstrapSampling: SamplingMutationResponse<BootstrapSamplingResult> },
    { input: BootstrapSamplingInput }
  >(EXECUTE_BOOTSTRAP_SAMPLING);
  const [stratified, stratifiedState] = useMutation<
    { executeStratifiedSampling: SamplingMutationResponse<StratifiedSamplingResult> },
    { input: StratifiedSamplingInput }
  >(EXECUTE_STRATIFIED_SAMPLING);
  const [quotas, quotaState] = useMutation<
    { executeQuotaSampling: SamplingMutationResponse<QuotaSamplingResult> },
    { input: QuotaSamplingInput }
  >(EXECUTE_QUOTA_SAMPLING);
  const loading = simpleState.loading || systematicState.loading || bootstrapState.loading || stratifiedState.loading || quotaState.loading;

  const request = (selectedMethod: SamplingMethod, input: Record<string, unknown>) => {
    setFeedback(null);
    setPending({ method: selectedMethod, input });
  };

  const execute = async () => {
    if (!pending) return;
    const selectedMethod = pending.method;
    try {
      let response: SamplingMutationResponse<SamplingResult> | undefined;
      if (selectedMethod === "simpleRandom") {
        const value = await simple({variables:{input:{fileId,...pending.input} as unknown as SimpleRandomSamplingInput}});
        response = value.data?.executeSimpleRandomSampling;
      } else if (selectedMethod === "systematic") {
        const value = await systematic({variables:{input:{fileId,...pending.input} as unknown as SystematicSamplingInput}});
        response = value.data?.executeSystematicSampling;
      } else if (selectedMethod === "bootstrap") {
        const value = await bootstrap({variables:{input:{fileId,...pending.input} as unknown as BootstrapSamplingInput}});
        response = value.data?.executeBootstrapSampling;
      } else if (selectedMethod === "stratified") {
        const value = await stratified({variables:{input:{fileId,...pending.input} as unknown as StratifiedSamplingInput}});
        response = value.data?.executeStratifiedSampling;
      } else {
        const value = await quotas({variables:{input:{fileId,...pending.input} as unknown as QuotaSamplingInput}});
        response = value.data?.executeQuotaSampling;
      }
      if (!response?.success || !response.data) throw new Error(response?.message||t("errors.execution"));
      setResult(response.data);
      setResultMethod(selectedMethod);
      setFeedback({color:"green",message:response.message||t("success")});
      await columnsQuery.refetch();
    } catch (error) {
      setFeedback({color:"red",message:error instanceof Error?error.message:t("errors.execution")});
    } finally {
      setPending(null);
    }
  };

  return <Stack spacing="lg">
    <ConfirmComponent opened={Boolean(pending)} onClose={()=>setPending(null)} confirmAction={()=>void execute()} title={t("confirmation.title")} description={t("confirmation.description")} customConfirmProps={{buttonColor:"brand",buttonLabel:t("confirmation.confirm")}}/>
    <Alert color="green" title={t("activeFile")}>{fileName || t("activeFileLoading")}</Alert>
    <SamplingSizeCalculator
      canApply={method !== "quotas"}
      onApply={setSuggestedSize}
    />
    <Card><Stack><div><Text weight={700}>{t("methodSelector.title")}</Text><Text size="sm" color="dimmed">{t("methodSelector.description")}</Text></div><SamplingMethodSelector value={method} disabled={loading} onChange={(value)=>{setMethod(value);setFeedback(null);}}/></Stack></Card>
    <Card><Stack><Text weight={700} size="lg">{t(`methods.${method}.title`)}</Text>
      {method==="simpleRandom"&&<SimpleRandomSamplingForm disabled={loading} suggestedSize={suggestedSize} onSubmit={input=>request(method,input)}/>}
      {method==="systematic"&&<SystematicSamplingForm disabled={loading} suggestedSize={suggestedSize} onSubmit={input=>request(method,input)}/>}
      {method==="bootstrap"&&<BootstrapSamplingForm disabled={loading} suggestedSize={suggestedSize} onSubmit={input=>request(method,input)}/>}
      {method==="stratified"&&<StratifiedSamplingForm columns={columns} disabled={loading} suggestedSize={suggestedSize} onSubmit={input=>request(method,input)}/>}
      {method==="quotas"&&<QuotaSamplingForm columns={columns} disabled={loading} suggestedSize={suggestedSize} onSubmit={input=>request(method,input)}/>}
      {columnsQuery.error&&<Alert color="red">{columnsQuery.error.message}</Alert>}
      {feedback&&<Alert color={feedback.color}>{feedback.message}</Alert>}
    </Stack></Card>
    {result&&<SamplingResultView method={resultMethod} result={result}/>}
  </Stack>;
}
