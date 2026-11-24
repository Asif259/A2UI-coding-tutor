import { describe, expect, it } from "vitest";
import { ISO_REPLY } from "../src/components/isoReply";

describe("isoReply", () => {
  it("is one accessible, self-contained SVG with three labelled layers", () => {
    expect(ISO_REPLY.trim().startsWith("<svg")).toBe(true);
    expect(ISO_REPLY).not.toMatch(/<script/i);

    const host = document.createElement("div");
    host.innerHTML = ISO_REPLY;
    const svg = host.querySelector("svg")!;
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-labelledby")).toBe("iso-reply-title");
    expect(host.querySelector("#iso-reply-title")?.textContent).toContain("Three stacked layers");

    expect(svg.querySelectorAll(".iso-block")).toHaveLength(3);
    expect(svg.querySelectorAll(".iso-block.is-active")).toHaveLength(1);
    expect(svg.querySelectorAll(".iso-pulse")).toHaveLength(1);

    const labels = [...svg.querySelectorAll(".iso-label")].map((n) => n.textContent);
    expect(labels).toEqual(["01 · PROMPT", "02 · CATALOG", "03 · SURFACE"]);
  });
});
