import { useRevealAttr, MaskedWords } from "../motion";
import { SettingsIcon } from "./Icons";

const MOCK_LINES = [
  { text: "> explain React hooks to me", cls: "mock-line--prompt" },
  { text: "[a2ui] rendering interactive surface…", cls: "mock-line--sys" },
  { text: "", cls: "mock-spacer" },
  { text: "Hooks let you use state and lifecycle features in function components.", cls: "" },
  { text: "", cls: "" },
  { text: "Try it yourself:", cls: "mock-line--sys" },
];

export default function Hero({ onProviders }: { onProviders: () => void }) {
  const title = useRevealAttr<HTMLHeadingElement>("text");

  return (
    <section className="hero hero--tool" id="top" aria-labelledby="hero-title">
      <div className="container">
        <header style={{ fontFamily: "var(--font-ui)", fontSize: "12px", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--neutral-500)" }}>
          01 — Tool workspace
        </header>

        <h1 className="h2 hero__title" id="hero-title" ref={title} style={{ margin: 0, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.1, fontWeight: 700, color: "var(--light-100)" }}>
          <MaskedWords text="Answers you can press." />
        </h1>

        {/* Mock IDE window */}
        <div className="hero__mock" role="img" aria-label="Screenshot of the A2UI tutor interface showing an interactive coding session with terminal output and provider panel access">
          <div className="hero__mock-head">
            <span aria-hidden="true" style={{ display: "flex", gap: "6px" }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
            </span>
            <span style={{ flex: 1, textAlign: "center", fontFamily: "var(--font-ui)", fontSize: "12px", color: "var(--neutral-600)", fontWeight: 500 }}>
              a2ui-tutor — session
            </span>
            <button
              type="button"
              onClick={onProviders}
              className="u-link"
              style={{ fontFamily: "var(--font-ui)", fontSize: "11px", color: "var(--neutral-600)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
              aria-label="Open providers and settings"
            >
              <SettingsIcon />
              <span>providers</span>
            </button>
          </div>

          <div className="hero__mock-body">
            {/* Sidebar mock */}
            <nav className="hero__mock-sidebar" aria-label="File tree">
              {["App.tsx", "api.ts", "catalog.ts", "Hero.tsx", "Studio.tsx"].map((file) => (
                <div key={file} style={{ padding: "4px 8px", borderRadius: 4, fontSize: "12px", fontFamily: "var(--font-ui)", color: file === "Studio.tsx" ? "var(--accent, #60a5fa)" : "var(--neutral-600)", background: file === "Studio.tsx" ? "rgba(96,165,250,.1)" : "transparent", cursor: "default" }}>
                  {file}
                </div>
              ))}
              <div className="mock-spacer" />
              <div style={{ padding: "4px 8px", fontSize: "11px", fontFamily: "var(--font-ui)", color: "var(--neutral-500)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                Problems
              </div>
              <div style={{ padding: "4px 8px", paddingLeft: 16, fontSize: "12px", fontFamily: "var(--font-ui)", color: "var(--neutral-500)" }}>
                ✕ 0 errors
              </div>
              <div style={{ padding: "4px 8px", paddingLeft: 16, fontSize: "12px", fontFamily: "var(--font-ui)", color: "var(--neutral-500)" }}>
                ⚠ 0 warnings
              </div>
            </nav>

            {/* Terminal area */}
            <div className="hero__mock-term">
              {MOCK_LINES.map((l, i) =>
                l.cls === "mock-spacer" ? (
                  <div key={i} className="mock-spacer" />
                ) : (
                  <pre key={i} className={l.cls || "mock-line"} style={{ margin: 0, whiteSpace: "pre-wrap" }}>{l.text}</pre>
                ),
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                <span style={{ color: "var(--ok)" }}>&gt;</span>
                <span style={{ display: "inline-block", width: 8, height: 16, background: "var(--accent, #60a5fa)", animation: "blink 1s step-end infinite" }} aria-label="cursor" />
                <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
              </div>
            </div>
          </div>

          <div className="hero__mock-footer">
            <span>session active</span>
            <span>model ready</span>
          </div>
        </div>
      </div>
    </section>
  );
}
