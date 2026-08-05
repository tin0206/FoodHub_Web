const TOKEN_KEY = "fh_access_token";

export function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Add it to .env.local (e.g. http://localhost:8000).",
    );
  }
  return base;
}

/** API origin without `/api/v1` suffix (used for `/media/...` images). */
export function getApiOrigin(): string {
  return getApiBaseUrl().replace(/\/api\/v1\/?$/, "");
}

/**
 * Resolve recipe/AI image URLs the same way as foodhub_mobile ApiConfig.resolveImageUrl.
 * Relative `/media/...` paths must hit the API host, not the Next.js origin.
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url || !url.trim()) return "";

  const trimmed = url.trim();
  let origin: string;
  try {
    origin = getApiOrigin();
  } catch {
    return trimmed;
  }

  // Relative path (including /media/...)
  if (trimmed.startsWith("/") || !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return `${origin}${path}`;
  }

  try {
    const parsed = new URL(trimmed);
    const path = parsed.pathname;
    const mediaIdx = path.indexOf("/foodhub-images/");
    if (mediaIdx >= 0) {
      const objectKey = path.slice(mediaIdx + "/foodhub-images/".length);
      return `${origin}/media/${objectKey}`;
    }
    if (path.startsWith("/media/")) {
      return `${origin}${path}${parsed.search}`;
    }
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return trimmed;
    }
  } catch {
    return `${origin}/${trimmed.replace(/^\//, "")}`;
  }

  return `${origin}/${trimmed.replace(/^\//, "")}`;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    return token && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

export function setAccessToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function extractDetail(data: unknown): string {
  if (!data || typeof data !== "object") return "Request failed";
  const detail = (data as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) {
          return String((item as { msg: unknown }).msg);
        }
        return JSON.stringify(item);
      })
      .join("; ");
  }
  if (detail != null) return JSON.stringify(detail);
  return "Request failed";
}

export type ApiFetchOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  /** Override Bearer token (e.g. demo fingerprint session). */
  token?: string | null;
  query?: Record<string, string | number | boolean | null | undefined>;
};

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { method = "GET", body, auth = true, token, query } = options;
  const base = getApiBaseUrl();
  const url = new URL(`${base}/api/v1${path.startsWith("/") ? path : `/${path}`}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const bearer = token !== undefined && token !== null ? token : getAccessToken();
    if (bearer) {
      headers.Authorization = `Bearer ${bearer}`;
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    throw new ApiError(extractDetail(data), res.status, data);
  }

  return data as T;
}
