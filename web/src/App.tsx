import { A2uiSurface } from "@a2ui/react";
import { MessageProcessor } from "@a2ui/web_core/v1_0";
import { useMemo, useRef, useState } from "react";
import { type ActionPayload, chat } from "./api";
import { createTutorCatalog } from "./catalog";
import Providers from "./Providers";

type Item =
  | { kind: "user"; text: string }
  | { kind: "tutor"; text: string; via?: string | null }
  | { kind: "surface"; id: string; via?: string | null };

export default function App() {
  const sessionId = useRef(crypto.randomUUID()).current;
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState(false);

  const send = async (body: { message: string } | { action: ActionPayload }) => {
    setBusy(true);
    setError("");
    try {
      const r = await chat(sessionId, body);
      mp.processMessages(r.messages as never);
      setItems((prev) => [
        ...prev,
        ...(r.text ? [{ kind: "tutor", text: r.text, via: r.provider } as Item] : []),
        ...(r.surfaceId ? [{ kind: "surface", id: r.surfaceId, via: r.provider } as Item] : []),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  // One processor for the whole conversation; a press on any surface goes back to the agent.
  const mp = useMemo(
    () => new MessageProcessor([createTutorCatalog()], (a) => void sendRef.current(a as never)),
    [],
  );
  const sendRef = useRef<(a: ActionPayload) => Promise<void>>(async () => {});
  sendRef.current = (a) => send({ action: a });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setItems((prev) => [...prev, { kind: "user", text }]);
    void send({ message: text });
  };

  return (
    <main className="app">
      <header className="bar">
        <h1>A2UI Tutor</h1>
        <button type="button" onClick={() => setSettings((v) => !v)} aria-expanded={settings}>
          AI providers
        </button>
      </header>
      {settings && <Providers />}
      <div className="feed" aria-live="polite">
        {items.length === 0 && (
          <p className="muted">Ask for a quiz ("quiz me on Python lists") or paste some code.</p>
        )}
        {items.map((it, i) =>
          it.kind === "surface" ? (
            <div className="surface" key={i}>
              <A2uiSurface surface={mp.getSurface(it.id) as never} />
              {it.via ? <small className="via">via {it.via}</small> : null}
            </div>
          ) : (
            <p key={i} className={it.kind === "user" ? "bubble user" : "bubble"}>
              {it.text}
            </p>
          ),
        )}
        {busy && <p className="muted">Thinking…</p>}
        {error && <p className="error">{error}</p>}
      </div>
      <form onSubmit={submit} className="composer">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question or paste code"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) submit(e);
          }}
        />
        <button type="submit" disabled={busy || !input.trim()}>
          Send
        </button>
      </form>
    </main>
  );
}
