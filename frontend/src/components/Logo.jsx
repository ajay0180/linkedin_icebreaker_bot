import { Sparkles } from "lucide-react";

export default function Logo({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
        <Sparkles size={19} strokeWidth={2.2} />
      </div>
      {!compact && (
        <div>
          <div className="font-display text-lg font-bold tracking-tight text-slate-950 dark:text-white">
            FirstLine
          </div>
          <div className="-mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            AI Icebreakers
          </div>
        </div>
      )}
    </div>
  );
}
