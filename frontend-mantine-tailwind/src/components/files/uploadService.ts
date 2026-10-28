import { postDataWithFile } from "../../lib/axios-client";
import { UploadedFile, UploadResult } from "./types";

const UPLOAD_ENDPOINT = "file/upload";

export async function uploadFile(
  file: File,
  projectId: string
): Promise<UploadResult> {
  try {
    const response = await postDataWithFile(
      UPLOAD_ENDPOINT,
      { projectId },
      file
    );

    if (!response?.success || !response.file) {
      return {
        success: false,
        message: response?.message || "UPLOAD_FAILED",
        file: null,
      };
    }

  const uploaded: UploadedFile = {
  id: response.file.id,
  name: response.file.name,
  type: response.file.type,
  size: response.file.size,
  projectId: response.file.projectId,
  createdAt: response.file.createdAt,   
};

    return { success: true, message: response.message, file: uploaded };
  } catch (error: any) {
    
    const backendMessage = error?.response?.data?.message;
    return {
      success: false,
      message: backendMessage || "UPLOAD_FAILED",
      file: null,
    };
  }
}