import { searchByType } from "../types.general";
import { Options } from "./model";
import { OptionInstance } from "./model/options.model";
export async function GetOptionBy(
  input: searchByType
): Promise<OptionInstance | OptionInstance[]> {
  const { param, value } = input;
  const whereCondition: Record<string, string> = {};
  whereCondition[param] = value;
  const result = await Options.findAll({
    where: whereCondition,
  });
  if (result.length === 1) {
    return result[0];
  }
  return result;
}
