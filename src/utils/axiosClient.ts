import axios, { AxiosError, AxiosResponse } from "axios";
import { API_BASE_URL, ONE_INCH_KEY } from "./constants";

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "json",
    Authorization: `Bearer ${ONE_INCH_KEY}`,
  },
});

axiosClient.interceptors.response.use(
  async (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    console.table({
      name: error.name,
      message: error.message,
      code: error.code,
    });
  },
);
