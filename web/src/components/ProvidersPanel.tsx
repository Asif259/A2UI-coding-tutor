import { type RefObject, useEffect, useRef } from "react";
import { lockScroll, useEscape, useFocusTrap } from "../motion";
import Providers from "../Providers";
import { CloseIcon } from "./Icons";

export default function ProvidersPanel({
  open,
  onClose,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLElement | null>;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const wasOpen = useRef(false);

  useEscape(open, onClose);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    lockScroll(open);
    if (open) {
      wasOpen.current = true;
      closeRef.current?.focus();
    } else if (wasOpen.current) {
      wasOpen.current = false;
      triggerRef.current?.focus();
    }
  }, [open, triggerRef]);

  return (
    <>
      <div className={`scrim${open ? " is-open" : ""}`} onClick={onClose} aria-hidden="true" />
      <div
        className={`panel${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="providers-title"
        aria-hidden={!open}
        inert={!open ? true : undefined}
        ref={panelRef}
      >
        <div className="panel__head">
          <div>
            <span className="eyebrow">Settings</span>
            <h2 className="h4" id="providers-title">
              AI providers
            </h2>
          </div>
          <button type="button" className="icon-btn" aria-label="Close provider settings" onClick={onClose} ref={closeRef}>
            <CloseIcon />
          </button>
        </div>
        <Providers />
      </div>
    </>
  );
}
