import { useReveal, useRevealAttr } from "../motion";
import { Arrow } from "./Icons";

export default function Cta({ onProviders }: { onProviders: () => void }) {
  const title = useRevealAttr<HTMLHeadingElement>("text");
  const row = useReveal<HTMLDivElement>(300);

  return (
    <section className="cta on-dark" aria-labelledby="cta-title">
      <div className="container">
        <h2 className="h2 cta__title" id="cta-title" ref={title}>
          Bring your own model key.
        </h2>
        <div className="cta__rule" />
        <div className="cta__row" ref={row}>
          <p className="body-md">
            Any OpenAI-compatible, Anthropic or Gemini endpoint. Keys are stored on the server, masked in the browser,
            and the next provider answers if one fails.
          </p>
          <div className="btn-row">
            <button type="button" className="btn btn--light btn--wide" onClick={onProviders}>
              Open provider settings
              <Arrow />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
