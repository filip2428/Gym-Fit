import axios, { type InternalAxiosRequestConfig } from "axios";
import { getToken, clearToken } from "./auth";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach the bearer token to every request.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear the token and bounce to /login.
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearToken();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

/** Resolve a (possibly relative) photo path returned by the API to an absolute URL. */
export function resolveAssetUrl(
  path: string | null | undefined
): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Extract a human-readable message from an axios error. */
export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong."
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; title?: string }
      | string
      | undefined;
    if (data && typeof data === "object") {
      if (data.message) return data.message;
      if (data.title) return data.title;
    } else if (typeof data === "string" && data) {
      return data;
    }
    if (error.message) return error.message;
  } else if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export default api;
