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

export const TUTOR_VIEWS: Record<string, (p: ViewProps) => ReactElement> = {
  CodeBlock,
  Quiz,
};
