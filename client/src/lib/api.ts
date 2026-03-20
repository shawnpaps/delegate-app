import { supabase } from "./supabase";

const BASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new ApiError(401, "No active session");
  }
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function api<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { body, headers: customHeaders, ...rest } = options;
  const authHeader = await getAuthHeader();

  const headers: Record<string, string> = {
    ...authHeader,
    ...customHeaders,
  };

  // Only set Content-Type to JSON if body is not FormData
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${BASE_URL}/functions/v1${path}`, {
    ...rest,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(response.status, errorText || `Request failed: ${response.status}`);
  }

  // Some endpoints return binary data (audio)
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("audio/")) {
    return response.blob() as T;
  }

  return response.json();
}

export const apiGet = <T>(path: string) => api<T>(path, { method: "GET" });
export const apiPost = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: "POST", body });
export const apiPatch = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: "PATCH", body });
export const apiDelete = <T>(path: string) => api<T>(path, { method: "DELETE" });
