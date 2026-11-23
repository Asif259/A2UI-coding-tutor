export interface ChatResponse {
  text: string;
  messages: Record<string, unknown>[];
  surfaceId: string | null;
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
