import { useReveal } from "../motion";
import { Plus } from "./Icons";

const QUESTIONS = [
  {
    q: "Do I need an account?",
    a: "No. There is no login. The app is meant to run on localhost: anyone who can reach the port can read replies, add providers and make the server call a base URL.",
  },
  {
    q: "Which models can it use?",
    a: "OpenAI-compatible endpoints (OpenAI, OpenRouter, DeepSeek, Groq, Ollama, LM Studio), Anthropic and Google Gemini. Providers are tried top to bottom, and a failing one sits out for 60 seconds.",
  },
  {
    q: "Where do API keys go?",
    a: "They stay on the server in agent/data/providers.json with mode 0600. The browser only receives a masked hint such as key …1234.",
  },
  {
    q: "Does it run my code?",
    a: "No. Run asks the model to reason about the output, and expectedOutput comes from the model, so it can be wrong. A real sandbox is a later step.",
  },
  {
    q: "Can it work without a key?",
    a: "With TUTOR_OFFLINE=1 the agent answers from a canned quiz. Useful for a first look and for tests; the same UI path serves real model output.",
  },
  {
    q: "Why only five components?",
    a: "The catalog is the guardrail. Fewer approved pieces means the model cannot drift into a wall of text, and every reply stays predictable to render and test.",
  },
  {
    q: "Does progress survive a restart?",
    a: "Not yet. Sessions and progress are in memory. Closing the server clears them; persisting them is on the roadmap.",
  },
  {
    q: "Can I add a component?",
    a: "Yes. Add it to the JSON catalog, regenerate the Python and TypeScript views, and the validator and renderer pick it up together.",
  },
];

export default function Faq() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="section" id="questions" aria-labelledby="questions-title">
      <div className="container faq--single" ref={ref}>
        <div className="intro" style={{ marginBottom: 0 }}>
          <div>
            <span className="eyebrow intro__eyebrow">05 — Questions</span>
            <h2 className="h3" id="questions-title">
              Before you start.
            </h2>
          </div>
          <p className="body-md muted">Straight answers about keys, guardrails and what the tool will not do.</p>
        </div>
        <div className="faq__list">
          {QUESTIONS.map((item) => (
            <details className="faq__item" key={item.q}>
              <summary>
                <span className="h6">{item.q}</span>
                <Plus />
              </summary>
              <p className="body-md">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
