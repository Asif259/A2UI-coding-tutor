import { type ReactElement, useState } from "react";
import { highlightLine } from "./highlight";

/** Props arrive resolved by the A2UI binder: bound values are values, actions are functions. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Props = Record<string, any>;
export interface ViewProps {
  props: Props;
}

const run = (action: unknown) => {
  if (typeof action === "function") void (action as () => unknown)();
};
const text = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export function CodeBlock({ props }: ViewProps) {
  const code = text(props.code);
  const language = text(props.language) || "python";
  const lines = code.replace(/\n$/, "").split("\n");
  const [localSelected, setLocalSelected] = useState<number | null>(null);
  const bound = typeof props.selectedLine === "number" ? props.selectedLine : null;
  const selected = bound ?? localSelected;
  const setSelectedLine: unknown = props.setSelectedLine;

  const select = (n: number) => {
    setLocalSelected(n);
    if (typeof setSelectedLine === "function") (setSelectedLine as (v: number) => void)(n);
  };
  const explain = () => {
    if (selected === null) return;
    // The binding was written synchronously above; fire on a microtask so context resolves.
    queueMicrotask(() => run(props.explainAction));
  };

  return (
    <figure className="tc-code" aria-label={text(props.title) || `${language} code`}>
      <figcaption className="tc-code__head">
        <span className="tc-code__title">{text(props.title)}</span>
        <span className="tc-code__lang">{language}</span>
        <span className="tc-code__actions">
          {props.runAction ? (
            <button type="button" onClick={() => run(props.runAction)}>
              Run
            </button>
          ) : null}
          {props.explainAction ? (
            <button type="button" onClick={explain} disabled={selected === null}>
              Explain line{selected === null ? "" : ` ${selected}`}
            </button>
          ) : null}
        </span>
      </figcaption>
      <pre className="tc-code__body">
        {lines.map((line, i) => {
          const n = i + 1;
          return (
            <div key={n} className={`tc-line${selected === n ? " is-selected" : ""}`}>
              <button
                type="button"
                className="tc-line__no"
                aria-label={`Select line ${n}`}
                aria-pressed={selected === n}
                onClick={() => select(n)}
              >
                {n}
              </button>
              <code
                className="tc-line__code"
                // highlight.js escapes its input; output is safe markup.
                dangerouslySetInnerHTML={{ __html: highlightLine(line, language) || "&nbsp;" }}
              />
            </div>
          );
        })}
      </pre>
    </figure>
  );
}

export function Quiz({ props }: ViewProps) {
  const options: string[] = Array.isArray(props.options) ? props.options.map(text) : [];
  const correct = Number(props.correctIndex);
  const bound = typeof props.selected === "number" ? props.selected : null;
  const [local, setLocal] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const chosen = bound ?? local;
  const answered = chosen !== null;

  const choose = (i: number) => {
    if (answered) return;
    setLocal(i);
    if (typeof props.setSelected === "function") (props.setSelected as (v: number) => void)(i);
    queueMicrotask(() => run(props.onAnswer));
  };
  const hint = () => {
    setShowHint(true);
    run(props.onHint);
  };

  return (
    <section className="tc-quiz" aria-label="Quiz">
      <p className="tc-quiz__q">{text(props.question)}</p>
      <div className="tc-quiz__opts" role="radiogroup" aria-label="Answer choices">
        {options.map((opt, i) => {
          const state = !answered
            ? ""
            : i === correct
              ? " is-correct"
              : i === chosen
                ? " is-wrong"
                : "";
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={chosen === i}
              disabled={answered}
              className={`tc-opt${state}`}
              onClick={() => choose(i)}
            >
              <span className="tc-opt__key">{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          );
        })}
      </div>
      {answered ? (
        <p className={`tc-quiz__fb ${chosen === correct ? "is-correct" : "is-wrong"}`} role="status">
          <strong>{chosen === correct ? "Correct." : "Not quite."}</strong> {text(props.explanation)}
        </p>
      ) : (
        <>
          {props.hint && (props.onHint || showHint) ? (
            <button type="button" className="tc-quiz__hintbtn" onClick={hint}>
              Hint
            </button>
          ) : null}
          {showHint && props.hint ? <p className="tc-quiz__hint">{text(props.hint)}</p> : null}
        </>
      )}
    </section>
  );
}

export function PredictOutput({ props }: ViewProps) {
  const language = text(props.language) || "python";
  const [guess, setGuess] = useState("");
  const [revealed, setRevealed] = useState(false);
  const expected = text(props.expectedOutput);
  const norm = (x: string) => x.trim().replace(/\s+/g, " ");
  const reveal = () => {
    if (typeof props.setPrediction === "function") (props.setPrediction as (v: string) => void)(guess);
    setRevealed(true);
    queueMicrotask(() => run(props.onReveal));
  };
  return (
    <section className="tc-predict" aria-label="Predict the output">
      <p className="tc-quiz__q">{text(props.prompt) || "What does this print?"}</p>
      <pre className="tc-code__body tc-predict__code">
        {text(props.code)
          .split("\n")
          .map((line, i) => (
            <div key={i} className="tc-line">
              <code
                className="tc-line__code"
                dangerouslySetInnerHTML={{ __html: highlightLine(line, language) || "&nbsp;" }}
              />
            </div>
          ))}
      </pre>
      <label className="tc-predict__label">
        Your prediction
        <textarea value={guess} disabled={revealed} rows={2} onChange={(e) => setGuess(e.target.value)} />
      </label>
      {revealed ? (
        <div role="status" className="tc-predict__result">
          <p className={norm(guess) === norm(expected) ? "tc-quiz__fb is-correct" : "tc-quiz__fb is-wrong"}>
            <strong>{norm(guess) === norm(expected) ? "Match." : "Different."}</strong>
          </p>
          <p>Actual output:</p>
          <pre className="tc-predict__out">{expected}</pre>
          {props.explanation ? <p>{text(props.explanation)}</p> : null}
        </div>
      ) : (
        <button type="button" onClick={reveal}>
          Reveal
        </button>
      )}
    </section>
  );
}

export function StepWalkthrough({ props }: ViewProps) {
  const steps: { title: string; body: string }[] = Array.isArray(props.steps) ? props.steps : [];
  return (
    <section className="tc-steps" aria-label={text(props.title) || "Walkthrough"}>
      {props.title ? <h3>{text(props.title)}</h3> : null}
      {steps.map((st, i) => (
        <details key={i} open={i === 0}>
          <summary>
            <span className="tc-steps__n">{i + 1}</span> {text(st.title)}
          </summary>
          <p>{text(st.body)}</p>
        </details>
      ))}
    </section>
  );
}

export function ProgressCard({ props }: ViewProps) {
  const topics: { name: string; mastery: number }[] = Array.isArray(props.topics) ? props.topics : [];
  const mastered = topics.filter((t) => t.mastery >= 80).length;
  return (
    <section className="tc-progress" aria-label={text(props.title) || "Progress"}>
      <h3>{text(props.title) || "Your progress"}</h3>
      <p className="tc-progress__sum">
        {mastered} of {topics.length} topics mastered
      </p>
      {topics.map((t) => (
        <div key={t.name} className="tc-progress__row">
          <span>{t.name}</span>
          <div
            role="progressbar"
            aria-label={t.name}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={t.mastery}
            className={`tc-progress__bar${t.mastery >= 80 ? " is-done" : ""}`}
          >
            <span style={{ width: `${t.mastery}%` }} />
          </div>
          <span>{t.mastery}%</span>
        </div>
      ))}
      {props.onContinue ? (
        <button type="button" onClick={() => run(props.onContinue)}>
          Keep going
        </button>
      ) : null}
    </section>
  );
}

export const TUTOR_VIEWS: Record<string, (p: ViewProps) => ReactElement> = {
  CodeBlock,
  Quiz,
  PredictOutput,
  StepWalkthrough,
  ProgressCard,
};
