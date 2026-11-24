import { useEffect, useRef, useState } from "react";
import { lockScroll, useFocusTrap, useNavHide } from "../motion";
import { CloseIcon, Logo, MenuIcon, SlidersIcon } from "./Icons";

const LINKS = [
  { href: "#session", label: "Session" },
  { href: "#how", label: "How a reply is built" },
  { href: "#questions", label: "Questions" },
];

export default function Nav({ onProviders }: { onProviders: () => void }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const wasOpen = useRef(false);
  useNavHide();
  useFocusTrap(drawerRef, open);

  useEffect(() => {
    lockScroll(open);
    return () => lockScroll(false);
  }, [open]);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      closeRef.current?.focus();
    } else if (wasOpen.current) {
      wasOpen.current = false;
      menuRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="nav" id="nav">
        <div className="container nav__inner">
          <a href="#top" aria-label="A2UI Tutor, back to top">
            <Logo />
          </a>
          <div className="nav__right">
            <nav className="nav__links" aria-label="Sections">
              {LINKS.map((l) => (
                <a className="nav__link" href={l.href} key={l.href} aria-current={l.href === "#session" ? "page" : undefined}>
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="nav__utils">
              <button type="button" className="nav__providers" onClick={onProviders}>
                <span className="dot" aria-hidden="true" />
                <span className="label">Providers</span>
              </button>
              <button
                type="button"
                className="icon-btn nav__menu"
                aria-label="Open menu"
                aria-expanded={open}
                ref={menuRef}
                onClick={() => setOpen(true)}
              >
                <MenuIcon />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div
        className={`drawer${open ? " is-open" : ""}`}
        aria-hidden={!open}
        inert={!open ? true : undefined}
        ref={drawerRef}
      >
        <button
          type="button"
          className="icon-btn drawer__close"
          aria-label="Close menu"
          ref={closeRef}
          onClick={() => setOpen(false)}
        >
          <CloseIcon />
        </button>
        <nav aria-label="Sections">
          <ul className="drawer__links">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a className="h4" href={l.href} onClick={() => setOpen(false)}>
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <button
                type="button"
                className="h4"
                onClick={() => {
                  setOpen(false);
                  onProviders();
                }}
              >
                <SlidersIcon /> Providers
              </button>
            </li>
          </ul>
        </nav>
        <p className="drawer__meta label-lg">Local only · no accounts</p>
      </div>
    </>
  );
}
