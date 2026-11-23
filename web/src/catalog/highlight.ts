import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import c from "highlight.js/lib/languages/c";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";

const languages = { bash, c, go, java, javascript, json, python, rust, sql, typescript };
for (const [name, def] of Object.entries(languages)) hljs.registerLanguage(name, def);

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Highlights one line to safe HTML. Unknown languages fall back to escaped text. */
export function highlightLine(line: string, language: string): string {
  if (!hljs.getLanguage(language)) return escapeHtml(line);
  return hljs.highlight(line, { language, ignoreIllegals: true }).value;
}
