import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Providers from "../src/Providers";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const row = (o = {}) => ({
  id: "p1", name: "Primary", format: "openai", baseUrl: "", defaultBaseUrl: "x",
  apiKeyHint: "…1234", model: "gpt-x", enabled: true, coolingDown: false, ...o,
});

describe("Providers panel", () => {
  it("lists providers without showing keys, and posts a new one", async () => {
    const calls: { method: string; url: string; body?: string }[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ method: init?.method ?? "GET", url, body: init?.body as string });
      const json = init?.method === "POST" ? row({ id: "p2" }) : [row()];
      return new Response(JSON.stringify(json), { status: init?.method === "POST" ? 201 : 200 });
    }));
    render(<Providers />);
    await screen.findByText("Primary");
    expect(screen.getByText(/key …1234/)).toBeTruthy();

    fireEvent.click(screen.getByText("+ Add provider"));
    fireEvent.change(screen.getByLabelText("Provider name"), { target: { value: "Backup" } });
    fireEvent.change(screen.getByLabelText("Model ID"), { target: { value: "m1" } });
    fireEvent.change(screen.getByLabelText("API key"), { target: { value: "sk-new" } });
    fireEvent.click(screen.getByText("Add provider"));
    await waitFor(() => expect(calls.some((c) => c.method === "POST")).toBe(true));
    const post = calls.find((c) => c.method === "POST")!;
    expect(JSON.parse(post.body!)).toMatchObject({ name: "Backup", model: "m1", apiKey: "sk-new", format: "openai" });
  });

  it("reorders by sending the full id list", async () => {
    const calls: { method: string; body?: string }[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_u: string, init?: RequestInit) => {
      calls.push({ method: init?.method ?? "GET", body: init?.body as string });
      return new Response(JSON.stringify([row({ id: "a", name: "A" }), row({ id: "b", name: "B" })]));
    }));
    render(<Providers />);
    await screen.findByText("A");
    fireEvent.click(screen.getByLabelText("Move A down"));
    await waitFor(() => expect(calls.some((c) => c.method === "PUT")).toBe(true));
    expect(JSON.parse(calls.find((c) => c.method === "PUT")!.body!)).toEqual({ ids: ["b", "a"] });
  });
});
