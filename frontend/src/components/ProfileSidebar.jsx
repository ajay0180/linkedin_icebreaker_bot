import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import Logo from "./Logo";

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ProfileSidebar({
  collapsed,
  onToggle,
  profiles,
  activeProfileId,
  onSelect,
  onDelete,
  onImport,
  onSettings,
}) {
  return (
    <aside
      className={`hidden h-screen shrink-0 flex-col border-r border-slate-200/80 bg-white/85 px-3 py-5 backdrop-blur-xl transition-all duration-300 dark:border-white/8 dark:bg-slate-950/80 lg:flex ${
        collapsed ? "w-[76px]" : "w-[284px]"
      }`}
    >
      <div className={`flex items-center ${collapsed ? "justify-center" : "px-2"}`}>
        <Logo compact={collapsed} />
      </div>

      <button
        onClick={onImport}
        className={`mt-8 flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 active:scale-[0.98] ${
          collapsed ? "mx-auto w-11" : "w-full"
        }`}
      >
        <Plus size={18} />
        {!collapsed && "Import profile"}
      </button>

      <div className="mt-7 flex-1 overflow-y-auto">
        {!collapsed && (
          <div className="mb-3 px-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Your profiles
          </div>
        )}
        <div className="space-y-1.5">
          {profiles.length === 0 && !collapsed && (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs leading-5 text-slate-400 dark:border-white/10">
              Import a profile to start crafting thoughtful openers.
            </div>
          )}
          {profiles.map((profile) => {
            const active = profile.profile_id === activeProfileId;
            return (
              <button
                key={profile.profile_id}
                onClick={() => onSelect(profile.profile_id)}
                title={profile.profile_owner}
                className={`group flex w-full items-center rounded-xl text-left transition ${
                  collapsed ? "justify-center p-2" : "gap-3 px-3 py-2.5"
                } ${
                  active
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/12 dark:text-indigo-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                }`}
              >
                <div
                  className={`grid size-9 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-500 dark:bg-white/8 dark:text-slate-300"
                  }`}
                >
                  {initials(profile.profile_owner)}
                </div>
                {!collapsed && (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">
                        {profile.profile_owner}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                        <FileText size={11} />
                        {profile.source_type.toUpperCase()}
                      </div>
                    </div>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(profile.profile_id);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") onDelete(profile.profile_id);
                      }}
                      className="rounded-md p-1.5 text-slate-300 opacity-0 transition hover:bg-white hover:text-rose-500 group-hover:opacity-100 dark:hover:bg-white/10"
                    >
                      <Trash2 size={14} />
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1 border-t border-slate-200 pt-3 dark:border-white/8">
        <button
          onClick={onSettings}
          className={`flex w-full items-center rounded-xl p-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white ${
            collapsed ? "justify-center" : "gap-3"
          }`}
        >
          <Settings size={18} />
          {!collapsed && "Settings"}
        </button>
        <button
          onClick={onToggle}
          className={`flex w-full items-center rounded-xl p-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 ${
            collapsed ? "justify-center" : "gap-3"
          }`}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && "Collapse sidebar"}
        </button>
      </div>
    </aside>
  );
}
