import { StatementWords, useStatement } from "../motion";

const TEXT = "A wall of text is a lecture. A surface is practice. The tutor answers with something you can press, and your press becomes the next question.";

export default function Statement() {
  const ref = useStatement(TEXT);
  return (
    <section className="statement" aria-label="What the tutor believes">
      <div className="container">
        <p className="h1 statement__text" data-words ref={ref}>
          <StatementWords text={TEXT} />
        </p>
      </div>
    </section>
  );
}
