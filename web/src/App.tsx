import { A2uiSurface } from "@a2ui/react";
import { MessageProcessor } from "@a2ui/web_core/v1_0";
import { useEffect, useMemo, useRef, useState } from "react";
import { type ActionPayload, chat } from "./api";
import { createTutorCatalog } from "./catalog";
import Providers from "./Providers";

type Body = { message: string } | { action: ActionPayload };
type Item =
  | { kind: "user"; text: string }
  | { kind: "tutor"; text: string; via?: string | null }
  | { kind: "surface"; id: string };

const STARTERS = [
  "Quiz me on Python list comprehensions",
  "Walk me through how recursion works",
  "What does this print: print(len({1, 2, 2, 3}))?",
];

export default function App() {
  const sessionId = useRef(crypto.randomUUID()).current;
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const last = useRef<Body | null>(null);
  const sendRef = useRef<(b: Body) => Promise<void>>(async () => {});
  const mp = useMemo(
    () => new MessageProcessor([createTutorCatalog()], (a) => void sendRef.current({ action: a as never })),
    [],
  );

  const send = async (body: Body) => {
    last.current = body;
    setBusy(true);
    setError("");
    try {
      const r = await chat(sessionId, body);
      mp.processMessages(r.messages as never);
      setItems((p) => [
        ...p,
        ...(r.text ? [{ kind: "tutor", text: r.text, via: r.provider } as Item] : []),
        ...(r.surfaceId ? [{ kind: "surface", id: r.surfaceId } as Item] : []),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  sendRef.current = send;

  const ask = (text: string) => {
    const v = text.trim();
    if (!v || busy) return;
    setInput("");
    setItems((p) => [...p, { kind: "user", text: v }]);
    void send({ message: v });
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [items, busy, error]);

  return (
    <div className="app">
      <header className="top">
        <span className="brand">A2UI Tutor</span>
        <button type="button" className="ghost" onClick={() => dialog.current?.showModal()}>
          Providers
        </button>
      </header>

      <main className="feed">
        {items.length === 0 ? (
          <section className="intro">
            <h1>Ask. Then press the answer.</h1>
            <p>Questions come back as quizzes, code you can pick apart and outputs you predict.</p>
            <div className="starters">
              {STARTERS.map((s) => (
                <button key={s} type="button" onClick={() => ask(s)}>
                  {s}
                </button>
              ))}
            </div>
          </section>
        ) : (
          items.map((it, i) =>
            it.kind === "user" ? (
              <p key={i} className="you">{it.text}</p>
            ) : it.kind === "tutor" ? (
              <p key={i} className="tutor">
                {it.text}
                {it.via ? <span className="via">{it.via}</span> : null}
              </p>
            ) : (
              <div key={it.id} className="card">
                <A2uiSurface surface={mp.getSurface(it.id) as never} />
              </div>
            ),
          )
        )}
        {busy && <p className="tutor wait" aria-live="polite">Thinking…</p>}
        {error && (
          <p className="err" role="alert">
            {error}{" "}
            <button type="button" className="ghost" onClick={() => last.current && void send(last.current)}>
              Retry
            </button>
          </p>
        )}
        <div ref={endRef} />
      </main>

      <form className="composer" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about any concept or paste code"
          aria-label="Your question"
          disabled={busy}
        />
        <button type="submit" disabled={busy || !input.trim()}>Ask</button>
      </form>

      <footer className="footer">
        <div className="footer__inner">
          <span className="footer__copy">© {new Date().getFullYear()} A2UI Tutor</span>
          <span className="footer__credit">
            Designed &amp; built by{" "}
            <a href="https://ashrafulasif.vercel.app" target="_blank" rel="noopener noreferrer">
              Ashraful Asif
            </a>
          </span>
        </div>
      </footer>

      <dialog ref={dialog} className="modal" onClick={(e) => e.target === dialog.current && dialog.current.close()}>
        <div className="modal__bar">
          <h2>Providers</h2>
          <button type="button" className="ghost" onClick={() => dialog.current?.close()}>Close</button>
        </div>
        <Providers />
      </dialog>
    </div>
  );
}
