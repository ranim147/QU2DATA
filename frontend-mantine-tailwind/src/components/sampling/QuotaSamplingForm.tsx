import { useState } from "react";
import { Checkbox, Group, MultiSelect, NumberInput, Select, Stack, TextInput } from "@mantine/core";
import { useTranslation } from "next-i18next";
import { AppButton } from "../../ui";
import { QuotaCellInput, QuotaSamplingInput, SamplingConfidence, SamplingFormProps } from "./types";

type Props=SamplingFormProps<Omit<QuotaSamplingInput,"fileId">>&{columns:string[]};
export default function QuotaSamplingForm({columns,disabled,onSubmit}:Props){
  const {t}=useTranslation("sampling");
  const [quotaColumns,setQuotaColumns]=useState<string[]>([]);
  const [cells,setCells]=useState<QuotaCellInput[]>([{values:{},target:1}]);
  const [seed,setSeed]=useState<number|"">(42);
  const [confidence,setConfidence]=useState<SamplingConfidence>(95);
  const [allowUnderfilled,setAllowUnderfilled]=useState(false);
  const updateValue=(index:number,column:string,value:string)=>setCells(current=>current.map((cell,i)=>i===index?{...cell,values:{...cell.values,[column]:value}}:cell));
  const invalid=quotaColumns.length===0||cells.length===0||cells.some(cell=>cell.target<=0||quotaColumns.some(column=>String(cell.values[column]??"").trim()===""))||typeof seed!=="number"||!Number.isInteger(seed);
  return <Stack><MultiSelect searchable label={t("fields.quotaColumns")} data={columns} value={quotaColumns} disabled={disabled} onChange={value=>{setQuotaColumns(value);setCells(current=>current.map(cell=>({...cell,values:Object.fromEntries(value.map(column=>[column,cell.values[column]??""]))})));}}/>{cells.map((cell,index)=><div key={index} className="rounded-lg border border-gray-200 p-4"><Group grow align="flex-end">{quotaColumns.map(column=><TextInput key={column} label={column} value={String(cell.values[column]??"")} disabled={disabled} onChange={event=>updateValue(index,column,event.currentTarget.value)}/>)}<NumberInput label={t("fields.target")} value={cell.target} min={1} precision={0} disabled={disabled} onChange={value=>setCells(current=>current.map((item,i)=>i===index?{...item,target:Number(value)||0}:item))}/><AppButton intent="ghost" disabled={disabled||cells.length===1} onClick={()=>setCells(current=>current.filter((_,i)=>i!==index))}>{t("actions.removeCell")}</AppButton></Group></div>)}<AppButton intent="ghost" disabled={disabled||quotaColumns.length===0} onClick={()=>setCells(current=>[...current,{values:Object.fromEntries(quotaColumns.map(column=>[column,""])),target:1}])}>{t("actions.addCell")}</AppButton><Group grow><NumberInput label={t("fields.seed")} value={seed} precision={0} disabled={disabled} onChange={setSeed}/><Select label={t("fields.confidence")} data={["90","95","99"]} value={String(confidence)} disabled={disabled} onChange={value=>setConfidence(Number(value||95) as SamplingConfidence)}/></Group><Checkbox label={t("fields.allowUnderfilled")} checked={allowUnderfilled} disabled={disabled} onChange={event=>setAllowUnderfilled(event.currentTarget.checked)}/><div className="flex justify-end"><AppButton disabled={disabled||invalid} onClick={()=>{if(typeof seed==="number")onSubmit({quotaColumns,quotas:cells,seed,confidence,allowUnderfilled});}}>{t("actions.execute")}</AppButton></div></Stack>;
}
