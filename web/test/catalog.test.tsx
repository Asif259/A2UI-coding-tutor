import { A2uiSurface } from "@a2ui/react";
import { MessageProcessor } from "@a2ui/web_core/v1_0";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TUTOR_CATALOG_ID, createTutorCatalog, tutorComponentNames } from "../src/catalog";
import catalogJson from "../src/catalog/tutor_catalog.json";

afterEach(cleanup);

const components = [
  {
    id: "root",
    component: "CodeBlock",
    code: "x = 1\nprint(x)",
    language: "python",
    selectedLine: { "@path": "/line" },
    explainAction: { event: { name: "explain_line", context: { line: { "@path": "/line" } } } },
  },
];
const quizComponents = [
  {
    id: "root",
    component: "Quiz",
    question: "What prints?",
    options: ["0", "1"],
    correctIndex: 1,
    explanation: "x is 1.",
    selected: { "@path": "/answer" },
    onAnswer: { event: { name: "quiz_answer", context: { choice: { "@path": "/answer" } } } },
  },
];

function setup(components: object[]) {
  const actions: { name: string; context: Record<string, unknown> }[] = [];
  const mp = new MessageProcessor([createTutorCatalog()], (a) => void actions.push(a as never));
  mp.processMessages([
    { version: "1.0", createSurface: { surfaceId: "s1", catalogId: TUTOR_CATALOG_ID, components } },
  ]);
  render(<A2uiSurface surface={mp.getSurface("s1") as never} />);
  return actions;
}

describe("tutor catalog", () => {
  it("draws every component the JSON catalog offers", () => {
    const custom = Object.keys(catalogJson.components).filter(
      (n) => !["Text", "Row", "Column", "Divider"].includes(n),
    );
    expect(tutorComponentNames().sort()).toEqual(custom.sort());
  });

  it("Quiz gives instant feedback and sends the chosen index", async () => {
    const actions = setup(quizComponents);
    fireEvent.click(screen.getByRole("radio", { name: /B\s*1/ }));
    expect(screen.getByRole("status").textContent).toContain("Correct.");
    await waitFor(() => expect(actions.map((a) => a.name)).toContain("quiz_answer"));
    expect(actions.find((a) => a.name === "quiz_answer")!.context.choice).toBe(1);
  });

  it("CodeBlock sends the selected line with Explain", async () => {
    const actions = setup(components);
    expect((screen.getByText(/Explain line/) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByLabelText("Select line 2"));
    fireEvent.click(screen.getByText(/Explain line 2/));
    await waitFor(() => expect(actions.map((a) => a.name)).toContain("explain_line"));
    expect(actions.find((a) => a.name === "explain_line")!.context.line).toBe(2);
  });
});
