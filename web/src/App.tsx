import { MessageProcessor } from "@a2ui/web_core/v1_0";
import { useMemo, useRef, useState } from "react";
import { type ActionPayload, chat } from "./api";
import { createTutorCatalog } from "./catalog";
import { useSmoothScroll } from "./motion";
import Cta from "./components/Cta";
import Faq from "./components/Faq";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import Nav from "./components/Nav";
import ProvidersPanel from "./components/ProvidersPanel";
import StartHere from "./components/StartHere";
import Statement from "./components/Statement";
import Studio, { type Item } from "./components/Studio";

type Body = { message: string } | { action: ActionPayload };

export default function App() {
  useSmoothScroll();
  const sessionId = useRef(crypto.randomUUID()).current;
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [clearNote, setClearNote] = useState("");
  const [settings, setSettings] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const providersTrigger = useRef<HTMLElement | null>(null);
  const lastBody = useRef<Body | null>(null);

  const sendRef = useRef<(b: Body) => Promise<void>>(async () => {});
  const mp = useMemo(
    () => new MessageProcessor([createTutorCatalog()], (a) => void sendRef.current({ action: a as never })),
    [],
  );

  const send = async (body: Body) => {
    lastBody.current = body;
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
  sendRef.current = send;

  const sendText = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    setItems((prev) => [...prev, { kind: "user", text: value }]);
    void send({ message: value });
  };

  const openProviders = () => {
    providersTrigger.current = document.activeElement as HTMLElement | null;
    setSettings(true);
  };

  const clear = () => {
    setItems([]);
    setError("");
    setClearNote("Session cleared. The next prompt starts fresh.");
    composerRef.current?.focus();
  };

  return (
    <>
      <a className="sr-only" href="#session">
        Skip to the session
      </a>
      <Nav onProviders={openProviders} />
      <main id="main">
        <Hero onProviders={openProviders} />
        <StartHere onPick={sendText} />
        <Statement />
        <Studio
          items={items}
          busy={busy}
          error={error}
          clearNote={clearNote}
          composerRef={composerRef}
          getSurface={(id) => mp.getSurface(id)}
          onSend={sendText}
          onClear={clear}
          onRetry={() => lastBody.current && void send(lastBody.current)}
          onProviders={openProviders}
        />
        <HowItWorks />
        <Faq />
        <Cta onProviders={openProviders} />
      </main>
      <Footer onProviders={openProviders} />
      <ProvidersPanel open={settings} onClose={() => setSettings(false)} triggerRef={providersTrigger} />
    </>
  );
}
