import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ProvidersPanel from "../src/components/ProvidersPanel";

let trigger: HTMLButtonElement;

beforeEach(() => {
  trigger = document.createElement("button");
  trigger.textContent = "open";
  document.body.append(trigger);
  trigger.focus();
  vi.stubGlobal("fetch", vi.fn(async () => new Response("[]", { status: 200 })));
});

afterEach(() => {
  trigger.remove();
  cleanup();
  vi.unstubAllGlobals();
});

describe("ProvidersPanel", () => {
  it("opens as a modal, focuses close, traps Escape and returns focus", async () => {
    const onClose = vi.fn();
    const triggerRef = createRef<HTMLButtonElement>();
    triggerRef.current = trigger;

    const { rerender } = render(<ProvidersPanel open onClose={onClose} triggerRef={triggerRef} />);
    const dialog = screen.getByRole("dialog", { name: "AI providers" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.hasAttribute("inert")).toBe(false);
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByLabelText("Close provider settings")),
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();

    rerender(<ProvidersPanel open={false} onClose={onClose} triggerRef={triggerRef} />);
    expect(dialog.getAttribute("aria-hidden")).toBe("true");
    expect(dialog.hasAttribute("inert")).toBe(true);
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});
