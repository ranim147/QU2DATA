import axios from "axios";
import Cookies from "universal-cookie";


const BASE_URL = process.env.NEXT_PUBLIC_REST_API_URL;
if (!BASE_URL) {
  throw "REST API IS UNDEFINED ! ";
}
const cookies = new Cookies();

// Function to fetch data from the API
const addTokenToHeader = (headers?: any) => {
  const token = cookies.get("quDataSenseToken") || null;

  if (headers) {
    return {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    };
  } else {
    return {
      authorization: token ? `Bearer ${token}` : "",
    };
  }
};
export const postDataWithFiles = async (
  endpoint: string,
  data,
  files: { [key: string]: File },
  headers?: any
) => {
  try {
    const headersWithToken = addTokenToHeader(headers);

    const formData = new FormData();

    // Append other data to the FormData
    for (const key in data) {
      formData.append(key, data[key]);
    }

    // Append files to the FormData
    for (const key in files) {
      formData.append(`${key}`, files[key]);
    }

    // Make the API request with FormData and headers
    const response = await axios.post(`${BASE_URL}/${endpoint}`, formData, {
      headers: {
        ...headersWithToken,
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error posting data with files:", error);
    throw error;
  }
};
export const postDataWithFile = async (
  endpoint: string,
  data,
  file,
  headers?: any
) => {
  try {
    const headersWithToken = addTokenToHeader(headers);

    const formData = new FormData();

    // Append other data to the FormData
    for (const key in data) {
      formData.append(key, data[key]);
    }

    // Append files to the FormData
    formData.append(`file`, file);

    // Make the API request with FormData and headers
    const response = await axios.post(`${BASE_URL}/${endpoint}`, formData, {
      headers: {
        ...headersWithToken,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error posting data with files:", error);
    throw error;
  }
};
export const postDataWithoutFile = async (
  endpoint: string,
  data,
  headers?: any
) => {
  try {
    const headersWithToken = addTokenToHeader(headers);

    const response = await axios.post(`${BASE_URL}/${endpoint}`, data, {
      headers: {
        ...headersWithToken,
        "Content-Type": "application/json", // Adjust content type as needed
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error posting data without files:", error);
    throw error;
  }
};

export const getFile = async (endpoint: string) => {
  const headersWithToken = addTokenToHeader();
  const response = await axios.get(endpoint, {
    headers: {
      ...headersWithToken,
      "Content-Type": "application/json", // Adjust based on your API requirements
    },
    responseType: "blob", // Ensures the response is handled as a Blob (binary data)
  });

  return response.data; // Return the Blob (file data)
};
// New getHelper function
export const getData = async (endpoint: string, params = {}, headers?: any) => {
  try {
    const headersWithToken = addTokenToHeader(headers);

    const response = await axios.get(`${BASE_URL}/${endpoint}`, {
      headers: headersWithToken,
      params, // Attach query parameters here
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};
export const putData = async (endpoint: string, data: any, headers?: any) => {
  try {
    const headersWithToken = addTokenToHeader(headers);
    const response = await axios.put(`${BASE_URL}/${endpoint}`, data, {
      headers: {
        ...headersWithToken,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error putting data:", error);
    throw error;
  }
};

export const patchData = async (endpoint: string, data: any, headers?: any) => {
  try {
    const headersWithToken = addTokenToHeader(headers);
    const response = await axios.patch(`${BASE_URL}/${endpoint}`, data, {
      headers: {
        ...headersWithToken,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error patching data:", error);
    throw error;
  }
};

export const deleteData = async (endpoint: string, headers?: any) => {
  try {
    const headersWithToken = addTokenToHeader(headers);
    const response = await axios.delete(`${BASE_URL}/${endpoint}`, {
      headers: headersWithToken,
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting data:", error);
    throw error;
  }
};

