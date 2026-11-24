export interface ChatResponse {
  text: string;
  messages: Record<string, unknown>[];
  surfaceId: string | null;
  provider?: string | null;
}

export interface ActionPayload {
  name: string;
  surfaceId: string;
  sourceComponentId: string;
  timestamp?: string;
  context?: Record<string, unknown>;
}

export async function chat(
  sessionId: string,
  body: { message: string } | { action: ActionPayload },
): Promise<ChatResponse> {
  const payload =
    "message" in body
      ? { sessionId, message: body.message }
      : {
          sessionId,
          a2ui: {
            version: "1.0",
            action: {
              ...body.action,
              timestamp: body.action.timestamp ?? new Date().toISOString(),
              context: body.action.context ?? {},
            },
          },
        };
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  return res.json();
}

export type ProviderFormat = "openai" | "anthropic" | "gemini";

export interface Provider {
  id: string;
  name: string;
  format: ProviderFormat;
  baseUrl: string;
  defaultBaseUrl: string;
  apiKeyHint: string;
  model: string;
  enabled: boolean;
  coolingDown: boolean;
}

export interface ProviderInput {
  name: string;
  format: ProviderFormat;
  baseUrl: string;
  apiKey: string;
  model: string;
  enabled: boolean;
}

async function call<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().then((j) => j.detail).catch(() => "");
    throw new Error(typeof detail === "string" && detail ? detail : `Server returned ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const providers = {
  list: () => call<Provider[]>("GET", "/api/providers"),
  add: (p: ProviderInput) => call<Provider>("POST", "/api/providers", p),
  update: (id: string, p: ProviderInput) => call<Provider>("PUT", `/api/providers/${id}`, p),
  remove: (id: string) => call<void>("DELETE", `/api/providers/${id}`),
  reorder: (ids: string[]) => call<Provider[]>("PUT", "/api/providers/order", { ids }),
  test: (id: string) => call<{ ok: boolean; message: string }>("POST", `/api/providers/${id}/test`),
  listModels: (body: { format: ProviderFormat; baseUrl: string; apiKey: string }) =>
    call<{ models: string[]; error?: string }>("POST", "/api/providers/models", body),
};
