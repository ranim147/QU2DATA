import axios from "axios";
import FormData from "form-data";

import { getFastApiConfig } from "../../Helpers/GeneralHelpers";
import { getFastApiToken } from "../../Helpers/ThirdPartFastApiHelper";

export type FastApiUploadData = {
  dataset_id: string;
  filename: string;
  file_size_bytes: number;
  row_count: number;
  column_count: number;
  columns: string[];
  dtypes: Record<string, string>;
  missing_values: Record<string, number>;
  preview: Record<string, unknown>[];
};

type FastApiUploadResponse = {
  success: boolean;
  message: string;
  data?: FastApiUploadData | null;
};

type FastApiUploadFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

export const uploadFileToFastApi = async (
  file: FastApiUploadFile
): Promise<FastApiUploadData> => {
  const form = new FormData();
  form.append("file", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
    knownLength: file.size,
  });

  const fastApiToken = await getFastApiToken();
  const { fastApiUrl } = getFastApiConfig();

  if (!fastApiUrl) {
    throw new Error("FAST API IS NOT CONFIGURED!");
  }

  const response = await axios.post<FastApiUploadResponse>(
    `${fastApiUrl}/upload`,
    form,
    {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${fastApiToken}`,
        Accept: "application/json",
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      validateStatus: () => true,
    }
  );

  if (
    response.status < 200 ||
    response.status >= 300 ||
    !response.data?.success ||
    !response.data.data?.dataset_id
  ) {
    throw new Error(
      response.data?.message ||
        `FastAPI upload failed with status ${response.status}`
    );
  }

  return response.data.data;
};
