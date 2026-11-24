import Lenis from "lenis";
import { type RefObject, useEffect, useRef, useState } from "react";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useSmoothScroll() {
  useEffect(() => {
    if (reduced()) return;
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]');
      if (!link) return;
      const hash = link.getAttribute("href");
      if (!hash || hash.length < 2) return;
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -72, duration: 1.4 });
      history.pushState(null, "", hash);
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      (target as HTMLElement).focus({ preventScroll: true });
    };
    document.addEventListener("click", onClick);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick);
      lenis.destroy();
      (window as unknown as { __lenis?: Lenis }).__lenis = undefined;
    };
  }, []);
}

export function lockScroll(locked: boolean) {
  const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  }
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

export function useReveal<T extends HTMLElement = HTMLDivElement>(delay = 0) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (delay) el.style.setProperty("--d", `${delay}ms`);
    el.classList.add("reveal");
    if (reduced() || !("IntersectionObserver" in window)) {
      el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        el.classList.add("is-in");
        io.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  return ref;
}

export function useRevealAttr<T extends HTMLElement = HTMLDivElement>(attr: "text" | "image" | "iso", delay = 0) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.setAttribute("data-reveal", attr);
    if (delay) el.style.setProperty("--d", `${delay}ms`);
    if (reduced()) {
      el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        el.classList.add("is-in");
        io.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [attr, delay]);
  return ref;
}

export function useNavHide() {
  useEffect(() => {
    if (reduced()) return;
    const nav = document.getElementById("nav");
    if (!nav) return;
    let last = window.scrollY;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) > 6) {
        const busy = document.querySelector(".drawer.is-open, .panel.is-open");
        const hide = y > last && y > window.innerHeight * 0.6 && !busy && !nav.matches(":focus-within");
        nav.classList.toggle("is-hidden", hide);
        last = y;
      }
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
}

export function useEscape(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscape();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onEscape]);
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/** Keeps Tab and Shift+Tab inside an open dialog or drawer. */
export function useFocusTrap<T extends HTMLElement>(ref: RefObject<T | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const all = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const visible = all.filter((n) => n.getClientRects().length > 0);
      const items = visible.length > 0 ? visible : all;
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const here = document.activeElement as HTMLElement | null;
      if (!here || !el.contains(here)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && here === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && here === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, ref]);
}

function mask(text: string) {
  return text.split(/(\s+)/);
}

/** Headline words rise out of masks. The parent needs data-reveal="text" and .is-in. */
export function MaskedWords({ text }: { text: string }) {
  const [base] = useState(() => 150);
  let index = 0;
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {mask(text).map((part, i) => {
          if (/^\s+$/.test(part)) return <span key={i}> </span>;
          const d = base + Math.min(index++ * 40, 600);
          return (
            <span className="tw" key={i}>
              <span className="tw__i" style={{ "--d": `${d}ms` } as React.CSSProperties}>
                {part}
              </span>
            </span>
          );
        })}
      </span>
    </>
  );
}

/** Statement: words light up as they cross the reading line, once each. */
export function useStatement(text: string) {
  const ref = useRef<HTMLParagraphElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const words = el.querySelectorAll<HTMLSpanElement>(".w");
    if (reduced() || !("IntersectionObserver" in window)) {
      words.forEach((w) => w.classList.add("is-on"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.target.classList.toggle("is-on", e.boundingClientRect.top < window.innerHeight * 0.62));
      },
      { rootMargin: "0px 0px -38% 0px" },
    );
    words.forEach((w) => io.observe(w));
    return () => io.disconnect();
  }, [text]);
  return ref;
}

export function StatementWords({ text }: { text: string }) {
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {mask(text).map((part, i) =>
          /^\s+$/.test(part) ? (
            <span key={i}> </span>
          ) : (
            <span className="w" key={i}>
              {part}
            </span>
          ),
        )}
      </span>
    </>
  );
}
