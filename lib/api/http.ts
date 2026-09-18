/**
 * 通用 HTTP 客户端 —— 统一基址、鉴权头、错误归一化。
 * 通过 `NEXT_PUBLIC_API_MODE=http` 切换到真实后端；否则走 Mock（见 lib/api/index.ts 分发）。
 */

const TOKEN_KEY = "lifebook-token";

/** 是否启用真实后端（构建时内联 NEXT_PUBLIC_* 环境变量）。 */
export function isHttpMode(): boolean {
  const mode = process.env.NEXT_PUBLIC_API_MODE;
  // 生产环境必须显式启用真实后端：未配置或非 "http" 时立即失败，禁止静默回退 Mock。
  if (process.env.NODE_ENV === "production" && mode !== "http") {
    throw new Error(
      "生产环境必须设置 NEXT_PUBLIC_API_MODE=http（真实后端），禁止静默回退 Mock。"
    );
  }
  return mode === "http";
}

/** API 基址：默认相对路径 `/api/v1`（由 next.config 代理到后端，避免 CORS）。 */
export function getApiBaseUrl(): string {
  // 浏览器端：相对路径走 next.config rewrites 代理，或使用显式绝对 URL。
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";
  }
  // 服务端（generateMetadata / Route Handler / Server Component）：Node fetch 无法解析相对 URL，
  // 必须使用绝对地址。优先取服务端专用 API_URL，其次复用显式的 NEXT_PUBLIC_API_URL。
  const absolute = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (absolute) return absolute;
  // 生产环境缺少绝对后端地址时立即失败（部署配置错误早暴露），而不是静默连 localhost。
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SSR 需要绝对后端地址：请设置 API_URL（例如 https://<后端域名>/api/v1），生产环境不能回退 localhost。"
    );
  }
  // 仅开发环境回退本机后端。
  return "http://localhost:3001/api/v1";
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!res.ok) {
    let message = `请求失败（${res.status}）`;
    try {
      const data = (await res.json()) as { message?: string; error?: string };
      message = data.message ?? data.error ?? message;
    } catch {
      // 非 JSON 错误体，保留默认信息
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body === undefined ? undefined : JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
