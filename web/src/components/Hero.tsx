import { useReveal, useRevealAttr, MaskedWords } from "../motion";
import { Arrow } from "./Icons";

const FACTS = ["Five approved components", "One JSON catalog", "No accounts"];

export default function Hero({ onProviders }: { onProviders: () => void }) {
  const title = useRevealAttr<HTMLHeadingElement>("text");
  const aside = useReveal<HTMLDivElement>(550);
  const band = useRevealAttr<HTMLDivElement>("image", 700);

  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="container">
        <span className="eyebrow hero__eyebrow">01 — Interactive surfaces</span>
        <div className="hero__head">
          <h1 className="h2 hero__title" id="hero-title" ref={title}>
            <MaskedWords text="Answers you can press." />
          </h1>
          <div className="hero__aside" ref={aside}>
            <p className="body-md muted">
              A2UI Tutor answers with a quiz, a code block or an output predictor — never a paragraph. Every surface is
              drawn from one approved catalog, and every press goes back to the model as the next question.
            </p>
            <div className="btn-row">
              <a className="btn btn--primary btn--wide" href="#session">
                Start a session
              </a>
              <a className="btn btn--secondary" href="#how">
                How a reply is built
                <Arrow />
              </a>
            </div>
          </div>
        </div>

        <ul className="hero__facts label-lg">
          {FACTS.map((f) => (
            <li key={f}>{f}</li>
          ))}
          <li>
            <button type="button" className="u-link" onClick={onProviders}>
              Model key needed
            </button>
          </li>
        </ul>

        <div className="hero__band" ref={band} data-slot="hero-band">
          <img
            src="/img/hero-band.svg"
            width="1680"
            height="720"
            alt="Placeholder for a wide photo of a quiet desk with a laptop, notebook and lamp in daylight"
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  );
}
