import { A2uiSurface } from "@a2ui/react";
import { useEffect, useRef, useState } from "react";
import {
  Arrow,
  BugIcon,
  CloseIcon,
  FileIcon,
  FolderIcon,
  Plus,
  SettingsIcon,
  SlidersIcon,
} from "./Icons";
import { useReveal } from "../motion";

export type Item =
  | { kind: "user"; text: string; id?: string }
  | { kind: "tutor"; text: string; id?: string; via?: string | null }
  | { kind: "surface"; id: string; via?: string | null };

interface Props {
  items: Item[];
  busy: boolean;
  error: string;
  clearNote: string;
  composerRef: React.RefObject<HTMLTextAreaElement | null>;
  getSurface: (id: string) => unknown;
  onSend: (text: string) => void;
  onClear: () => void;
  onRetry: () => void;
  onProviders: () => void;
}

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
  const feedRef = useRef<HTMLDivElement | null>(null);
  const hasItems = items.length > 0;
  const revealError = useReveal();
  const revealEmpty = useReveal();
  const revealFeed = useReveal();

  useEffect(() => {
    if (!busy && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [items, busy]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleSend = async () => {
    const value = input.trim();
    if (!value || busy) return;
    setInput("");
    onSend(value);
  };

  const userMessages = items.filter((i): i is Extract<Item, { kind: "user" }> => i.kind === "user");

  return (
    <section className="studio" aria-label="Coding session">
      {/* Window chrome */}
      <div className="window-chrome" role="toolbar" aria-label="Window controls">
        <div className="traffic-lights" aria-hidden="true">
          <span className="traffic-light traffic-light--close" />
          <span className="traffic-light traffic-light--minimise" />
          <span className="traffic-light traffic-light--maximise" />
        </div>
        <nav className="tab-bar" aria-label="Session tabs">
          {hasItems ? (
            <>
              {userMessages.map((msg, idx) => (
                <button
                  key={msg.id ?? idx}
                  className={`tab${idx === userMessages.length - 1 ? " is-active" : ""}`}
                  onClick={() => {
                    // Scroll to this message in the feed
                    const el = feedRef.current?.querySelector(
                      `[data-msg-id="${msg.id}"]`,
                    );
                    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                  }}
                >
                  <span className="tab__label">{msg.text.slice(0, 32)}{msg.text.length > 32 ? "…" : ""}</span>
                  <span className="tab-close" aria-label="Close tab">
                    <CloseIcon />
                  </span>
                </button>
              ))}
              <button className="tab tab--add" aria-label="New conversation">
                <Plus />
              </button>
            </>
          ) : (
            <span className="tab is-active">
              <span className="tab__label">Untitled session</span>
            </span>
          )}
        </nav>
        <button
          className="chrome-btn"
          aria-label="Open providers"
          onClick={onProviders}
          title="Providers &amp; settings"
        >
          <SlidersIcon />
        </button>
      </div>

      {/* Main IDE layout */}
      <div className="studio--ide">
        {/* Sidebar – file explorer */}
        <aside className="studio__side" role="complementary" aria-label="File explorer">
          <div className="sidebar-section">
            <div className="sidebar-section__head">
              <FolderIcon />
              <span>EXPLORER</span>
            </div>
            <ul className="sidebar-list" role="list">
              <li className="sidebar-item is-folder">
                <span className="sidebar-icon"><FolderIcon /></span>
                <span className="sidebar-label">src</span>
              </li>
              <li className="sidebar-item" style={{ paddingLeft: "1rem" }}>
                <span className="sidebar-icon"><FileIcon /></span>
                <span className="sidebar-label">App.tsx</span>
              </li>
              <li className="sidebar-item" style={{ paddingLeft: "1rem" }}>
                <span className="sidebar-icon"><FileIcon /></span>
                <span className="sidebar-label">api.ts</span>
              </li>
              <li className="sidebar-item" style={{ paddingLeft: "1rem" }}>
                <span className="sidebar-icon"><FileIcon /></span>
                <span className="sidebar-label">catalog.ts</span>
              </li>
              <li className="sidebar-item is-folder">
                <span className="sidebar-icon"><FolderIcon /></span>
                <span className="sidebar-label">components</span>
              </li>
              <li className="sidebar-item" style={{ paddingLeft: "1rem" }}>
                <span className="sidebar-icon"><FileIcon /></span>
                <span className="sidebar-label">Studio.tsx</span>
              </li>
              <li className="sidebar-item" style={{ paddingLeft: "1rem" }}>
                <span className="sidebar-icon"><FileIcon /></span>
                <span className="sidebar-label">Icons.tsx</span>
              </li>
              <li className="sidebar-item" style={{ paddingLeft: "1rem" }}>
                <span className="sidebar-icon"><FileIcon /></span>
                <span className="sidebar-label">Hero.tsx</span>
              </li>
            </ul>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section__head">
              <BugIcon />
              <span>TROUBLESHOOT</span>
            </div>
            <ul className="sidebar-list" role="list">
              <li className="sidebar-item">
                <span className="sidebar-icon"><SettingsIcon /></span>
                <span className="sidebar-label">Debug console</span>
              </li>
              <li className="sidebar-item">
                <span className="sidebar-icon"><SettingsIcon /></span>
                <span className="sidebar-label">Problem summary</span>
              </li>
            </ul>
          </div>
        </aside>

        {/* Feed + Composer area */}
        <div className="studio__work">
          <div className="feed" ref={feedRef} role="log" aria-live="polite" aria-label="Conversation">
            {!hasItems ? (
              <div className="feed__empty" ref={revealEmpty}>
                <div className="feed__empty-icon" aria-hidden="true">
                  <Arrow />
                </div>
                <p className="feed__empty-title">A2UI Tutor</p>
                <p className="feed__empty-sub">
                  Type a learning goal or paste code to begin. The tutor will surface interactive exercises and explanations as you go.
                </p>
              </div>
            ) : (
              <div ref={revealFeed}>
                {items.map((item, idx) =>
                  item.kind === "user" ? (
                    <div key={item.id ?? idx} className="msg msg--user" data-msg-id={item.id}>
                      <span className="msg__prompt" aria-hidden="true">&gt; </span>
                      {item.text}
                    </div>
                  ) : item.kind === "tutor" ? (
                    <div key={item.id ?? idx} className="msg msg--tutor">
                      <p>{item.text}</p>
                      {item.via && (
                        <span className="msg__via">→ {item.via}</span>
                      )}
                    </div>
                  ) : (
                    <div key={item.id} className="surface-wrap">
                      <A2uiSurface surface={getSurface(item.id) as never} />
                    </div>
                  ),
                )}
              </div>
            )}

            {error && (
              <div className="state-line state-line--error" ref={revealError} role="alert">
                <span className="state-line__icon" aria-hidden="true">✕</span>
                <span>{error}</span>
                <button className="btn btn--muted" onClick={onRetry} type="button">Retry</button>
              </div>
            )}

            {clearNote && (
              <div className="state-line" ref={revealError} role="status">
                <span className="state-line__icon" aria-hidden="true">⟳</span>
                <span>{clearNote}</span>
              </div>
            )}

            {busy && (
              <div className="msg msg--tutor" aria-live="polite">
                <span className="skeleton"><span /></span>
              </div>
            )}
          </div>

          {/* Status bar */}
          <div className="status-bar" role="status" aria-label="Session status">
            <div className="status-bar__left">
              <span className="status-badge">
                {hasItems ? `${items.length} messages` : "Ready"}
              </span>
              <span className="status-dot" aria-hidden="true" />
            </div>
            <div className="status-bar__right">
              {hasItems && (
                <button className="status-btn" onClick={onClear} type="button">
                  Clear
                </button>
              )}
              <button className="status-btn" onClick={onProviders} type="button">
                <SettingsIcon />
                Providers
              </button>
            </div>
          </div>

          {/* Composer */}
          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
          >
            <textarea
              ref={composerRef}
              className="composer__area"
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything… (⌘/Ctrl+Enter to send)"
              disabled={busy}
              aria-label="Type your message"
            />
            <button
              className="composer__send"
              type="submit"
              disabled={!input.trim() || busy}
              aria-label="Send message"
            >
              <Arrow />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
