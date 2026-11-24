import { useReveal } from "../motion";
import { Arrow } from "./Icons";

export const PROMPTS = [
  {
    prompt: "Quiz me on Python lists.",
    title: "Quiz me on Python lists.",
    desc: "A multiple-choice surface with instant feedback and a hint.",
  },
  {
    prompt: "Give me code with a bug and let me predict the output.",
    title: "Find the bug in this loop.",
    desc: "A CodeBlock to select a line, then a PredictOutput surface.",
  },
  {
    prompt: "Walk me through how a for loop runs.",
    title: "Walk through a for loop.",
    desc: "Collapsible steps, one iteration at a time, at your pace.",
  },
];

export default function StartHere({ onPick }: { onPick: (prompt: string) => void }) {
  const head = useReveal<HTMLDivElement>();

  return (
    <section className="section section--tight" aria-labelledby="start-title">
      <div className="container">
        <div className="intro" ref={head}>
          <div>
            <span className="eyebrow intro__eyebrow">02 — Start here</span>
            <h2 className="h3" id="start-title">
              Send a prompt, get a surface.
            </h2>
          </div>
          <p className="body-md muted">
            The work here is generated live by the model. Pick a row to send it straight into the session below.
          </p>
        </div>
        <div className="rows" data-stagger="80">
          {PROMPTS.map((p, i) => (
            <Row key={p.prompt} index={i + 1} title={p.title} desc={p.desc} onPick={() => onPick(p.prompt)} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Row({ index, title, desc, onPick }: { index: number; title: string; desc: string; onPick: () => void }) {
  const ref = useReveal<HTMLButtonElement>(index * 80);
  return (
    <button type="button" className="rows__item" ref={ref} onClick={onPick}>
      <span className="label-lg">{String(index).padStart(2, "0")}</span>
      <span className="h4">{title}</span>
      <span className="body-md muted rows__desc">{desc}</span>
      <Arrow />
    </button>
  );
}
