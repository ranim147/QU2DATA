import { useLazyQuery } from "@apollo/client";
import { Alert, Button, Group, MultiSelect, NumberInput, Pagination, Select, Stack, Text, TextInput } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "next-i18next";
import DatasetTable from "../DatasetTable";
import { FILTER_ROWS, SORT_ROWS, VIEW_ROWS } from "../query";
import { DatasetResult, RowFilterCondition, RowFilterOperator, RowOperationResult, RowSortRule } from "../types";

type Mode = "view" | "sort" | "filter";
interface Props { mode: Mode; fileId: string; columns: string[]; source: DatasetResult | null; }
type Response = Record<string, { success: boolean; message: string; data?: RowOperationResult | null }>;
const operators: RowFilterOperator[] = ["=", "!=", ">", ">=", "<", "<=", "between", "contains", "not_contains", "starts_with", "ends_with", "in", "is_null", "is_not_null"];

export default function RowOperationsPanel({ mode, fileId, columns, source }: Props) {
  const { t } = useTranslation("transformations");
  const document = mode === "view" ? VIEW_ROWS : mode === "sort" ? SORT_ROWS : FILTER_ROWS;
  const [runQuery, { loading }] = useLazyQuery<Response>(document, { fetchPolicy: "no-cache" });
  const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(20); const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [logic, setLogic] = useState<"AND" | "OR">("AND");
  const [sorts, setSorts] = useState<RowSortRule[]>([{ column: columns[0] ?? "", direction: "asc" }]);
  const [filters, setFilters] = useState<Array<RowFilterCondition & { raw?: string }>>([{ column: columns[0] ?? "", operator: "=", raw: "" }]);
  const [result, setResult] = useState<RowOperationResult | null>(null); const [error, setError] = useState<string | null>(null); const [success, setSuccess] = useState(false);
  const parseValue = (rule: RowFilterCondition & { raw?: string }) => {
    if (["is_null", "is_not_null"].includes(rule.operator)) return undefined;
    const raw = rule.raw ?? ""; const numeric = source?.data.some((row) => typeof row[rule.column] === "number");
    if (rule.operator === "between") return raw.split(",").map((item) => Number(item.trim()));
    if (rule.operator === "in") return raw.split(",").map((item) => item.trim()).filter(Boolean);
    return numeric && ["=", "!=", ">", ">=", "<", "<="].includes(rule.operator) ? Number(raw) : raw;
  };
  const execute = async (requestedPage = page) => {
    setError(null); setSuccess(false);
    const validSorts = sorts.filter((rule) => rule.column);
    const validFilters = filters.filter((rule) => rule.column).map(({ raw, ...rule }) => ({ ...rule, value: parseValue({ ...rule, raw }) }));
    if (mode === "sort" && !validSorts.length) return setError(t("rowOperations.validation.sort"));
    if (mode === "filter" && (!validFilters.length || validFilters.some((rule) => !["is_null", "is_not_null"].includes(rule.operator) && (rule.value === "" || (Array.isArray(rule.value) && !rule.value.length))))) return setError(t("rowOperations.validation.filter"));
    const variables: Record<string, unknown> = { fileId, page: requestedPage, pageSize };
    if (mode === "view") Object.assign(variables, { columns: selectedColumns.length ? selectedColumns : undefined, conditions: [], logic: "AND", sortBy: [] });
    if (mode === "sort") variables.sortBy = validSorts;
    if (mode === "filter") Object.assign(variables, { conditions: validFilters, logic });
    try { const response = await runQuery({ variables }); const payload = response.data?.[`${mode}Rows`]; if (!payload?.success || !payload.data) throw new Error(payload?.message || t("rowOperations.error")); setPage(requestedPage); setResult(payload.data); setSuccess(true); } catch (exception) { setError(exception instanceof Error ? exception.message : t("rowOperations.error")); }
  };
  const reset = () => { setResult(null); setSuccess(false); setError(null); setPage(1); if (mode === "sort") setSorts([{ column: columns[0] ?? "", direction: "asc" }]); if (mode === "filter") setFilters([{ column: columns[0] ?? "", operator: "=", raw: "" }]); };
  return <Stack spacing="md">
    <div><Text weight={700} size="lg">{t(`rowOperations.${mode}.title`)}</Text><Text size="sm" color="dimmed">{t("rowOperations.readOnly")}</Text></div>
    <Group grow><NumberInput label={t("rowOperations.pageSize")} min={1} max={500} value={pageSize} onChange={(value) => setPageSize(Number(value) || 20)} /><NumberInput label={t("rowOperations.page")} min={1} value={page} onChange={(value) => setPage(Number(value) || 1)} /></Group>
    {mode === "view" && <MultiSelect label={t("rowOperations.columns")} data={columns} value={selectedColumns} onChange={setSelectedColumns} clearable searchable />}
    {mode === "sort" && <Stack>{sorts.map((rule, index) => <Group key={index} grow><Select data={columns} value={rule.column} onChange={(column) => setSorts((items) => items.map((item, i) => i === index ? { ...item, column: column ?? "" } : item))} /><Select data={[{value:"asc",label:t("rowOperations.asc")},{value:"desc",label:t("rowOperations.desc") }]} value={rule.direction} onChange={(direction) => setSorts((items) => items.map((item,i)=>i===index?{...item,direction:(direction ?? "asc") as "asc"|"desc"}:item))}/><Button color="red" variant="subtle" onClick={()=>setSorts((items)=>items.filter((_,i)=>i!==index))}>{t("rowOperations.remove")}</Button></Group>)}<Button variant="light" onClick={()=>setSorts((items)=>[...items,{column:columns[0]??"",direction:"asc"}])}>{t("rowOperations.addSort")}</Button></Stack>}
    {mode === "filter" && <Stack><Select label={t("rowOperations.logic")} data={["AND","OR"]} value={logic} onChange={(value)=>setLogic((value??"AND") as "AND"|"OR")}/>{filters.map((rule,index)=><Group key={index} grow><Select data={columns} value={rule.column} onChange={(column)=>setFilters((items)=>items.map((item,i)=>i===index?{...item,column:column??""}:item))}/><Select data={operators} value={rule.operator} onChange={(operator)=>setFilters((items)=>items.map((item,i)=>i===index?{...item,operator:(operator??"=") as RowFilterOperator}:item))}/>{!["is_null","is_not_null"].includes(rule.operator)&&<TextInput placeholder={rule.operator === "between" || rule.operator === "in" ? "value1, value2" : t("rowOperations.value")} value={rule.raw??""} onChange={(event)=>setFilters((items)=>items.map((item,i)=>i===index?{...item,raw:event.currentTarget.value}:item))}/>}<Button color="red" variant="subtle" onClick={()=>setFilters((items)=>items.filter((_,i)=>i!==index))}>{t("rowOperations.remove")}</Button></Group>)}<Button variant="light" onClick={()=>setFilters((items)=>[...items,{column:columns[0]??"",operator:"=",raw:""}])}>{t("rowOperations.addFilter")}</Button></Stack>}
    {error && <Alert color="red">{error}</Alert>}{success && <Alert color="green">{t("rowOperations.success")}</Alert>}
    <Group><Button loading={loading} disabled={loading || !columns.length} onClick={()=>execute(1)}>{t("rowOperations.run")}</Button><Button variant="default" disabled={loading} onClick={reset}>{t("rowOperations.reset")}</Button></Group>
    {result && <><DatasetTable title={t("rowOperations.result")} dataset={{success:true,message:"",columns:result.columns,rows:result.rows,rowCount:result.rows,data:result.data}} />{result.totalPages > 1 && <Pagination total={result.totalPages} value={result.page} onChange={(next)=>execute(next)} />}</>}
  </Stack>;
}
