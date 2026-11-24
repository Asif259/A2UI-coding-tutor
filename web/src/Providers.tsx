import { useCallback, useEffect, useState } from "react";
import { type Provider, type ProviderFormat, type ProviderInput, providers } from "./api";

const FORMATS: { value: ProviderFormat; label: string }[] = [
  { value: "openai", label: "OpenAI-compatible (OpenAI, OpenRouter, DeepSeek, Ollama…)" },
  { value: "anthropic", label: "Anthropic" },
  { value: "gemini", label: "Google Gemini" },
];
const BLANK: ProviderInput = {
  name: "",
  format: "openai",
  baseUrl: "",
  apiKey: "",
  model: "",
  enabled: true,
};
const DEFAULT_URL: Record<ProviderFormat, string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com",
  gemini: "https://generativelanguage.googleapis.com",
};

export default function Providers() {
  const [list, setList] = useState<Provider[]>([]);
  const [form, setForm] = useState<ProviderInput | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  // Auto-fetch model state (new-provider only)
  const [modelError, setModelError] = useState("");
  const [fetchingModels, setFetchingModels] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  const refresh = useCallback(
    () => providers.list().then(setList).catch((e) => setError(String(e.message ?? e))),
    [],
  );
  useEffect(() => void refresh(), [refresh]);

  const guard = async (fn: () => Promise<unknown>) => {
    setError("");
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const move = (i: number, d: -1 | 1) => {
    const ids = list.map((p) => p.id);
    [ids[i], ids[i + d]] = [ids[i + d]!, ids[i]!];
    void guard(() => providers.reorder(ids));
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    void guard(async () => {
      if (editing) await providers.update(editing, form);
      else await providers.add(form);
      setForm(null);
      setEditing(null);
      setModelError("");
      setAvailableModels([]);
    });
  };

  const edit = (p: Provider) => {
    setEditing(p.id);
    setForm({ name: p.name, format: p.format, baseUrl: p.baseUrl, apiKey: "", model: p.model, enabled: p.enabled });
  };

  // Auto-fetch model IDs when format / base URL / API key are all present on *add* mode.
  useEffect(() => {
    if (!form || editing) return;
    const ready = !!form.format && !!form.baseUrl.trim() && !!form.apiKey.trim();
    setModelError("");
    setAvailableModels([]);
    if (!ready) return;
    setFetchingModels(true);
    providers
      .listModels({ format: form.format, baseUrl: form.baseUrl.trim(), apiKey: form.apiKey.trim() })
      .then((r) => {
        if (r.error) {
          setModelError(r.error);
          return;
        }
        setAvailableModels(r.models);
        if (r.models.length > 0 && !form.model) {
          setForm({ ...form, model: r.models[0] });
        }
      })
      .catch((e) => setModelError(e instanceof Error ? e.message : String(e)))
      .finally(() => setFetchingModels(false));
  }, [form?.format, form?.baseUrl, form?.apiKey, editing, form?.model]);

  return (
    <section className="prov" aria-label="AI providers">
      <p className="muted">
        Providers are tried top to bottom. If one runs out of quota or fails, the next one answers.
      </p>
      {error && <p className="error">{error}</p>}
      <ol className="prov__list">
        {list.map((p, i) => (
          <li key={p.id} className={p.enabled ? "" : "is-off"}>
            <div className="prov__main">
              <strong>{p.name}</strong>
              <span className="muted">
                {p.format} · {p.model} · key {p.apiKeyHint || "none"}
                {p.coolingDown ? " · cooling down after an error" : ""}
              </span>
              {note[p.id] && <span role="status">{note[p.id]}</span>}
            </div>
            <div className="prov__btns">
              <button type="button" aria-label={`Move ${p.name} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
              <button type="button" aria-label={`Move ${p.name} down`} disabled={i === list.length - 1} onClick={() => move(i, 1)}>↓</button>
              <button
                type="button"
                onClick={() =>
                  void guard(() =>
                    providers.update(p.id, { name: p.name, format: p.format, baseUrl: p.baseUrl, apiKey: "", model: p.model, enabled: !p.enabled }),
                  )
                }
              >
                {p.enabled ? "Disable" : "Enable"}
              </button>
              <button
                type="button"
                onClick={() =>
                  void providers
                    .test(p.id)
                    .then((r) => setNote((n) => ({ ...n, [p.id]: (r.ok ? "✓ " : "✗ ") + r.message })))
                    .catch((e) => setNote((n) => ({ ...n, [p.id]: "✗ " + e.message })))
                }
              >
                Test
              </button>
              <button type="button" onClick={() => edit(p)}>Edit</button>
              <button
                type="button"
                onClick={() => confirm(`Delete ${p.name}?`) && void guard(() => providers.remove(p.id))}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
        {list.length === 0 && <li className="muted">No providers yet. Add one to start chatting.</li>}
      </ol>

      {form ? (
        <form className="prov__form" onSubmit={save}>
          <h3>{editing ? "Edit provider" : "Add custom provider"}</h3>
          <label>Provider name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>
            API format
            <select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value as ProviderFormat })}>
              {FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </label>
          <label>
            Base URL
            <input placeholder={DEFAULT_URL[form.format]} value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} />
          </label>
          <label>
            API key
            <input type="password" autoComplete="off" placeholder={editing ? "leave blank to keep the saved key" : ""} value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} />
          </label>
          <label>
            Model ID
            <input
              required
              value={form.model}
              onChange={(e) => { setForm({ ...form, model: e.target.value }); setModelError(""); }}
            />
          </label>
          {!editing && (
            <>
              {fetchingModels && <p className="muted">Fetching model IDs…</p>}
              {modelError && <p className="error">{modelError}</p>}
              {availableModels.length > 0 && (
                <p className="muted prov__models">
                  Available models: {availableModels.join(", ")}{" "}
                  <button type="button" className="muted" onClick={() => setAvailableModels([])} title="clear">✕</button>
                </p>
              )}
            </>
          )}
          <div className="prov__btns">
            <button type="submit">{editing ? "Save" : "Add provider"}</button>
            <button type="button" onClick={() => { setForm(null); setEditing(null); setModelError(""); setAvailableModels([]); }}>Cancel</button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setForm({ ...BLANK })}>+ Add provider</button>
      )}
    </section>
  );
}
