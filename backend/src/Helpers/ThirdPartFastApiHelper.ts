import axios from "axios";
import { getFastApiConfig } from "./GeneralHelpers";

let fast_api_token = null;
let fast_api_token_request_at = null;

const { token_expire, fastApiUrl, api_secret, api_key } = getFastApiConfig();

export function extractFastApiErrorMessage(error: unknown): string | null {
    if (!axios.isAxiosError(error)) {
        return null;
    }

    const message = error.response?.data?.message;
    return typeof message === "string" && message.trim()
        ? message
        : null;
}

function rethrowFastApiError(error: unknown): never {
    const message = extractFastApiErrorMessage(error);
    if (message) {
        throw new Error(message);
    }

    throw error;
}

export async function loginToFastApi() {
    let result;
    try {
        result = await axios.post(`${fastApiUrl}/auth/token`, {
            api_key,
            api_secret
        });
    } catch (error) {
        rethrowFastApiError(error);
    }

    if (!result.data.success) {
        throw new Error(result.data.message);
    }

    fast_api_token = result.data.data.token;
    fast_api_token_request_at = Date.now();

    return fast_api_token;
}

export async function getFastApiToken() {
    const now = Date.now();

    // Token missing OR token expired
    if (
        !fast_api_token ||
        !fast_api_token_request_at ||
        now - fast_api_token_request_at >= token_expire
    ) {
        return await loginToFastApi();
    }

    return fast_api_token;
}

export async function getDataFromFastApi(
    url: string,

    query_params?: Record<string, string | number | boolean>

) {
    const token = await getFastApiToken();
    const final_url = `${fastApiUrl}/${url}`;

    let result;
    try {
        result = await axios.get(final_url, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
            params: query_params,
        });
    } catch (error) {
        rethrowFastApiError(error);
    }

    if (!result.data.success) {
        throw new Error(result.data.message);
    }

    return result.data;
}

export async function postDataToFastApi(
    url: string,
    options?: {
        body?: Record<string, any>;
        file?: File | Blob;
        fileFieldName?: string;
    }
) {
    const token = await getFastApiToken();
    const final_url = `${fastApiUrl}/${url}`;

    let data: any;
    let headers: any = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
    };

    // Case 1: With file => multipart/form-data
    if (options?.file) {
        const formData = new FormData();

        // Add normal fields
        if (options.body) {
            Object.entries(options.body).forEach(([key, value]) => {
                formData.append(key, String(value));
            });
        }

        // Add file
        formData.append(
            options.fileFieldName || "file",
            options.file
        );

        data = formData;

        // Browser automatically sets boundary
        headers["Content-Type"] = "multipart/form-data";
    }
    // Case 2: Without file => JSON
    else {
        data = options?.body || {};

        headers["Content-Type"] = "application/json";
    }

    let result;
    try {
        result = await axios.post(final_url, data, {
            headers,
        });
    } catch (error) {
        rethrowFastApiError(error);
    }

    if (!result.data.success) {
        throw new Error(result.data.message);
    }

    return result.data;
}
