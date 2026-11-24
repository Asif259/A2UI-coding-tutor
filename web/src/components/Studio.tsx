import { A2uiSurface } from "@a2ui/react";
import { type FormEvent, type KeyboardEvent, type RefObject, useState } from "react";
import { useReveal } from "../motion";
import { Arrow, SlidersIcon } from "./Icons";

export type Item =
  | { kind: "user"; text: string; via?: string | null }
  | { kind: "tutor"; text: string; via?: string | null }
  | { kind: "surface"; id: string; via?: string | null };

type Props = {
  items: Item[];
  busy: boolean;
  error: string;
  clearNote: string;
  composerRef: RefObject<HTMLTextAreaElement | null>;
  getSurface: (id: string) => unknown;
  onSend: (text: string) => void;
  onClear: () => void;
  onRetry: () => void;
  onProviders: () => void;
};

export default function Studio({
  items,
  busy,
  error,
  clearNote,
  composerRef,
  getSurface,
  onSend,
  onClear,
  onRetry,
  onProviders,
}: Props) {
  const [input, setInput] = useState("");
  const side = useReveal<HTMLDivElement>();
  const feed = useReveal<HTMLDivElement>(100);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    onSend(text);
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const canSend = !busy && input.trim().length > 0;

  return (
    <section className="section section--white" id="session" aria-labelledby="session-title">
      <div className="container studio">
        <div className="studio__side" ref={side}>
          <span className="eyebrow">03 — Session</span>
          <h2 className="h3" id="session-title">
            The feed.
          </h2>
          <p className="body-md muted">
            One conversation per tab. Surfaces render here as the agent sends them, and a press on any surface returns
            to the agent as your next move.
          </p>
          <div className="studio__meta">
            <div className="studio__meta-row label-lg">
              <span className="muted">Provider</span>
              <span className="muted">{items.some((i) => i.via) ? "answering" : "on call"}</span>
            </div>
            <div className="studio__meta-row label-lg">
              <button type="button" className="u-link" onClick={onProviders}>
                <SlidersIcon /> Configure
              </button>
              <button type="button" className="u-link" onClick={onClear} disabled={items.length === 0}>
                Clear
              </button>
            </div>
            <p className="label-sm muted" role="status" aria-live="polite">
              {clearNote}
            </p>
          </div>
        </div>

        <div>
          <div className="feed" ref={feed} aria-live="polite">
            {items.length === 0 && !busy && !error ? (
              <div className="feed__empty">
                <h3 className="h5">Nothing asked yet.</h3>
                <p className="body-md muted">
                  Type a topic or paste a snippet. Start with “quiz me on Python lists” or a piece of code you want read
                  line by line.
                </p>
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => composerRef.current?.focus()}>
                  Write a prompt
                </button>
              </div>
            ) : null}

            {items.map((it, i) =>
              it.kind === "surface" ? (
                <div className="surface reveal is-in" key={`s${i}`}>
                  <div className="surface__card">
                    <A2uiSurface surface={getSurface(it.id) as never} />
                  </div>
                  {it.via ? <span className="msg__via">Answered via {it.via}</span> : null}
                </div>
              ) : (
                <p key={`m${i}`} className={`msg body-md ${it.kind === "user" ? "msg--user" : "msg--tutor"}`}>
                  {it.text}
                  {it.via ? <span className="msg__via">Answered via {it.via}</span> : null}
                </p>
              ),
            )}

            {busy ? (
              <div className="skeleton" aria-label="Waiting for the next surface">
                <span />
                <span />
                <span />
              </div>
            ) : null}

            {error ? (
              <p className="state-line state-line--error">
                Reply failed: {error}
                <button type="button" className="retry" onClick={onRetry}>
                  Retry
                </button>
              </p>
            ) : null}
          </div>

          <form className="composer" onSubmit={submit}>
            <label className="label-lg" htmlFor="prompt" style={{ display: "block", marginBottom: 8, color: "var(--text-muted)" }}>
              Your prompt
            </label>
            <textarea
              id="prompt"
              ref={composerRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={3}
              placeholder="Ask a question or paste code"
              disabled={busy}
            />
            <div className="composer__foot">
              <span className="label-lg composer__hint">Enter sends · Shift + Enter adds a line</span>
              <button type="submit" className="btn btn--primary" disabled={!canSend}>
                Send prompt
                <Arrow />
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
