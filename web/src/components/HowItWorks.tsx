import { useReveal, useRevealAttr } from "../motion";
import { ISO_REPLY } from "./isoReply";

const STEPS = [
  { n: "01", title: "You send a prompt", body: "A message, or a press on an existing surface. Both go back to the agent." },
  { n: "02", title: "The catalog checks the reply", body: "The model must answer in approved JSON. An unknown component or a one-option quiz never reaches the renderer." },
  { n: "03", title: "The renderer draws it", body: "Only the five approved components render, inside the same catalog the validator read." },
];

export default function HowItWorks() {
  const text = useReveal<HTMLDivElement>();
  const figure = useRevealAttr<HTMLElement>("iso", 120);

  return (
    <section className="section" id="how" aria-labelledby="how-title">
      <div className="container illo-split">
        <div className="illo-split__text" ref={text}>
          <span className="eyebrow">04 — Guardrails</span>
          <h2 className="h3" id="how-title">
            How a reply is built.
          </h2>
          <p className="body-md muted">
            The prompt is a request, not a promise. A validator sits between the model and the screen, and the catalog
            is the only vocabulary the model can draw with.
          </p>
          <ol className="steps" data-stagger="80">
            {STEPS.map((s) => (
              <li key={s.n}>
                <span className="label-lg">{s.n}</span>
                <span>
                  <span className="h6">{s.title}</span>
                  <p className="body-sm muted">{s.body}</p>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <figure className="illo" ref={figure} dangerouslySetInnerHTML={{ __html: ISO_REPLY }} />
      </div>
    </section>
  );
}
