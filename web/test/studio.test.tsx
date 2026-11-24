import { cleanup, createEvent, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Studio, { type Item } from "../src/components/Studio";

afterEach(cleanup);

const props = (over: Partial<Parameters<typeof Studio>[0]> = {}) => ({
  items: [] as Item[],
  busy: false,
  error: "",
  clearNote: "",
  composerRef: createRef<HTMLTextAreaElement>(),
  getSurface: () => null,
  onSend: vi.fn(),
  onClear: vi.fn(),
  onRetry: vi.fn(),
  onProviders: vi.fn(),
  ...over,
});

describe("Studio", () => {
  it("shows the empty state and sends a trimmed prompt", () => {
    const onSend = vi.fn();
    render(<Studio {...props({ onSend })} />);
    expect(screen.getByText("Nothing asked yet.")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Your prompt"), { target: { value: "  quiz me  " } });
    fireEvent.click(screen.getByRole("button", { name: /Send prompt/ }));
    expect(onSend).toHaveBeenCalledWith("quiz me");
    expect((screen.getByLabelText("Your prompt") as HTMLTextAreaElement).value).toBe("");
  });

  it("sends on Enter but inserts a newline on Shift+Enter", () => {
    const onSend = vi.fn();
    render(<Studio {...props({ onSend })} />);
    const input = screen.getByLabelText("Your prompt");
    fireEvent.change(input, { target: { value: "hello" } });

    const shifted = createEvent.keyDown(input, { key: "Enter", shiftKey: true });
    fireEvent(input, shifted);
    expect(shifted.defaultPrevented).toBe(false);
    expect(onSend).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSend).toHaveBeenCalledWith("hello");
  });

  it("disables Clear with no items and shows a retry on error", () => {
    const onClear = vi.fn();
    const onRetry = vi.fn();
    const { rerender } = render(<Studio {...props({ onClear, onRetry })} />);
    expect((screen.getByRole("button", { name: "Clear" }) as HTMLButtonElement).disabled).toBe(true);

    rerender(
      <Studio
        {...props({
          onClear,
          onRetry,
          items: [{ kind: "user", text: "hi" }, { kind: "tutor", text: "there", via: "Mock" }],
          error: "boom",
        })}
      />,
    );
    expect(screen.getByText(/Reply failed: boom/)).toBeTruthy();
    expect(screen.getByText("Answered via Mock")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClear).toHaveBeenCalled();
  });
});
