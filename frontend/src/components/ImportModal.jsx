import { useRef, useState } from "react";
import {
  Braces,
  Check,
  FileText,
  Link,
  LoaderCircle,
  UploadCloud,
  X,
} from "lucide-react";
import {
  importManualProfile,
  importPdfProfile,
  importTextProfile,
} from "../api";

const tabs = [
  { id: "pdf", label: "Profile PDF", icon: UploadCloud },
  { id: "text", label: "Paste text", icon: FileText },
  { id: "manual", label: "Manual", icon: Braces },
];

const emptyForm = {
  fullName: "",
  headline: "",
  sourceUrl: "",
  text: "",
  summary: "",
  skills: "",
  company: "",
  title: "",
};

export default function ImportModal({ open, onClose, userId, onImported }) {
  const [tab, setTab] = useState("pdf");
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef(null);

  if (!open) return null;

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!userId.trim()) {
      setError("Set a user ID in Settings before importing a profile.");
      return;
    }

    setLoading(true);
    try {
      let result;
      if (tab === "pdf") {
        if (!file) throw new Error("Choose a LinkedIn profile or resume PDF.");
        result = await importPdfProfile(userId, {
          file,
          fullName: form.fullName,
          headline: form.headline,
          sourceUrl: form.sourceUrl,
        });
      } else if (tab === "text") {
        result = await importTextProfile(userId, {
          full_name: form.fullName,
          headline: form.headline,
          source_url: form.sourceUrl || null,
          text: form.text,
        });
      } else {
        result = await importManualProfile(userId, {
          full_name: form.fullName,
          headline: form.headline,
          summary: form.summary,
          skills: form.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
          experiences:
            form.title || form.company
              ? [{ title: form.title, company: form.company }]
              : [],
          source_url: form.sourceUrl || null,
        });
      }
      onImported(result);
      setForm(emptyForm);
      setFile(null);
      onClose();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/60 bg-white shadow-2xl shadow-slate-950/20 dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 dark:border-white/8">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-950 dark:text-white">
              Import a professional profile
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Add consented profile data to create grounded icebreakers.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/8 dark:hover:text-white"
          >
            <X size={19} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1 border-b border-slate-100 px-6 pt-4 dark:border-white/8">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setTab(id);
                setError("");
              }}
              className={`flex items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition ${
                tab === id
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              value={form.fullName}
              onChange={update("fullName")}
              placeholder="e.g. Satya Nadella"
              required
            />
            <Field
              label="Headline"
              value={form.headline}
              onChange={update("headline")}
              placeholder="e.g. CEO at Microsoft"
            />
          </div>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Link size={15} /> Source URL
              <span className="font-normal text-slate-400">(optional)</span>
            </span>
            <input
              type="url"
              value={form.sourceUrl}
              onChange={update("sourceUrl")}
              placeholder="https://www.linkedin.com/in/..."
              className="input"
            />
          </label>

          {tab === "pdf" && (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className={`flex min-h-44 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
                file
                  ? "border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/8"
                  : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-white/10 dark:bg-white/[0.025] dark:hover:border-indigo-500/40"
              }`}
            >
              <input
                ref={fileInput}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
              <div
                className={`grid size-12 place-items-center rounded-2xl ${
                  file
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15"
                    : "bg-white text-indigo-600 shadow-sm dark:bg-white/8 dark:text-indigo-400"
                }`}
              >
                {file ? <Check size={22} /> : <UploadCloud size={23} />}
              </div>
              <div className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                {file ? file.name : "Choose a PDF or drop it here"}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Text-based PDF, up to 10 MB
              </div>
            </button>
          )}

          {tab === "text" && (
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Profile content
              </span>
              <textarea
                value={form.text}
                onChange={update("text")}
                minLength={20}
                required
                rows={8}
                placeholder="Paste the About, Experience, Education, and Skills sections..."
                className="input resize-none leading-6"
              />
            </label>
          )}

          {tab === "manual" && (
            <>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Professional summary
                </span>
                <textarea
                  value={form.summary}
                  onChange={update("summary")}
                  rows={4}
                  placeholder="What does this person work on?"
                  className="input resize-none"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Current role"
                  value={form.title}
                  onChange={update("title")}
                  placeholder="Product Designer"
                />
                <Field
                  label="Company"
                  value={form.company}
                  onChange={update("company")}
                  placeholder="Acme"
                />
              </div>
              <Field
                label="Skills"
                value={form.skills}
                onChange={update("skills")}
                placeholder="Product strategy, UX research, Figma"
                hint="Separate skills with commas"
              />
            </>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/8 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 dark:hover:bg-white/8"
            >
              Cancel
            </button>
            <button
              disabled={loading}
              className="flex min-w-36 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <LoaderCircle size={17} className="animate-spin" />}
              {loading ? "Indexing profile" : "Import profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, hint, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </span>
      <input {...props} className="input" />
      {hint && <span className="mt-1.5 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}
