import { ZodError, z } from "zod";
import { ApolloError } from "apollo-server-express";
import dataSourceConfig from "../Config/config.json";

export function getDataSourceEncryptionKey(): string {
  const key = dataSourceConfig.DATA_SOURCE_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      "DATA_SOURCE_ENCRYPTION_KEY est absente du fichier config.json"
    );
  }

  return key;
}

import * as path from "path";
import * as fs from "fs";
const configPath = path.join(__dirname, "../", "Config", "config.json");

let config;

try {
  const configData = fs.readFileSync(configPath, "utf-8");
  config = JSON.parse(configData);
} catch (error) {
  console.error("Error reading config.json:", error);
  process.exit(1);
}
export function GenerateUserName(email?: string): string {
  if (email && email.includes("@")) {
    return email.split("@")[0];
  }
  return "user" + Math.floor(Math.random() * 1000);
}

export function parseDataValidation(
  data: any,
  schema: z.ZodObject<typeof data>
) {
  try {
    schema.parse(data);
    return true;
  } catch (error) {
    if (error instanceof ZodError) {
      console.log(error.errors);
      return {
        message: `Input validation failed`,
        success: false,
      };
    } else {
      throw error;
    }
  }
}

export function generateAlphanumericString(length: number): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export const getFastApiConfig = () => {
  const { fast_api_micro_services_config } = config;
  if (!fast_api_micro_services_config)
    throw new Error("FAST API IS NOT CONFIGURED")
  return fast_api_micro_services_config;
}
