import { CheckCircle2, LoaderCircle, Server, UserRound, X } from "lucide-react";

export default function SettingsModal({
  open,
  onClose,
  userId,
  onUserIdChange,
  health,
  onHealthCheck,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-950 dark:text-white">
              Workspace settings
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Configure your local backend identity.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-white/8"
          >
            <X size={19} />
          </button>
        </div>

        <label className="mt-6 block">
          <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <UserRound size={15} /> User partition ID
          </span>
          <input
            value={userId}
            onChange={(event) => onUserIdChange(event.target.value)}
            placeholder="e.g. ajay-workspace"
            className="input"
          />
          <span className="mt-2 block text-xs leading-5 text-slate-400">
            This ID partitions your profiles in Qdrant. Keep it stable across
            sessions and do not use it as authentication.
          </span>
        </label>

        <div className="mt-5 rounded-2xl border border-slate-200 p-4 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/8">
                <Server size={17} />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Backend connection
                </div>
                <div className="text-xs text-slate-400">
                  {health === "online"
                    ? "API is reachable"
                    : health === "offline"
                      ? "API is unavailable"
                      : health === "checking"
                        ? "Checking connection..."
                        : "Not checked yet"}
                </div>
              </div>
            </div>
            {health === "online" && (
              <CheckCircle2 size={20} className="text-emerald-500" />
            )}
          </div>
          <button
            onClick={onHealthCheck}
            disabled={health === "checking"}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-60 dark:bg-white/8 dark:text-slate-200 dark:hover:bg-white/12"
          >
            {health === "checking" && (
              <LoaderCircle size={16} className="animate-spin" />
            )}
            Test connection
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Save settings
        </button>
      </div>
    </div>
  );
}
