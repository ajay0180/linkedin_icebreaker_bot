import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  BriefcaseBusiness,
  Check,
  Copy,
  FileUp,
  Lightbulb,
  Menu,
  MessageSquareText,
  Moon,
  Plus,
  RotateCcw,
  Sparkles,
  Sun,
  Target,
  UserRoundSearch,
  X,
} from "lucide-react";
import { chatWithProfile, checkHealth } from "./api";
import ImportModal from "./components/ImportModal";
import Logo from "./components/Logo";
import ProfileSidebar from "./components/ProfileSidebar";
import SettingsModal from "./components/SettingsModal";
import { useLocalStorage } from "./hooks/useLocalStorage";

const suggestions = [
  {
    icon: Target,
    title: "Warm opener",
    prompt:
      "Write a warm, specific two-sentence icebreaker based on their most interesting professional experience.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Shared interests",
    prompt:
      "Identify a likely shared professional interest and draft a natural conversation opener without inventing facts.",
  },
  {
    icon: Lightbulb,
    title: "Recent work",
    prompt:
      "Create a thoughtful question about their recent role or project that shows genuine research.",
  },
  {
    icon: MessageSquareText,
    title: "Connection note",
    prompt:
      "Write a concise LinkedIn connection note under 250 characters using only this profile's information.",
  },
];

const createUserId = () =>
  `workspace-${crypto.randomUUID?.().slice(0, 8) || Date.now()}`;

function App() {
  const [profiles, setProfiles] = useLocalStorage("firstline_profiles", []);
  const [activeProfileId, setActiveProfileId] = useLocalStorage(
    "firstline_active_profile",
    "",
  );
  const [userId, setUserId] = useLocalStorage(
    "firstline_user_id",
    createUserId(),
  );
  const [conversations, setConversations] = useLocalStorage(
    "firstline_conversations",
    {},
  );
  const [theme, setTheme] = useLocalStorage("firstline_theme", "light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [health, setHealth] = useState("idle");
  const [query, setQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEnd = useRef(null);

  const activeProfile = profiles.find(
    (profile) => profile.profile_id === activeProfileId,
  );
  const messages = useMemo(
    () => conversations[activeProfileId] || [],
    [activeProfileId, conversations],
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (!activeProfileId && profiles[0]) {
      setActiveProfileId(profiles[0].profile_id);
    }
  }, [activeProfileId, profiles, setActiveProfileId]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const subtitle = useMemo(() => {
    if (!activeProfile) return "Build better first conversations";
    return `${activeProfile.source_type.toUpperCase()} profile ready for grounded insights`;
  }, [activeProfile]);

  const handleImported = (profile) => {
    const savedProfile = {
      profile_id: profile.profile_id,
      profile_owner: profile.profile_owner,
      source_type: profile.source_type,
      chunks_indexed: profile.chunks_indexed,
      imported_at: new Date().toISOString(),
    };
    setProfiles((current) => [
      savedProfile,
      ...current.filter((item) => item.profile_id !== profile.profile_id),
    ]);
    setActiveProfileId(profile.profile_id);
    setConversations((current) => ({
      ...current,
      [profile.profile_id]: [],
    }));
  };

  const deleteProfile = (profileId) => {
    const remaining = profiles.filter(
      (profile) => profile.profile_id !== profileId,
    );
    setProfiles(remaining);
    setConversations((current) => {
      const next = { ...current };
      delete next[profileId];
      return next;
    });
    if (activeProfileId === profileId) {
      setActiveProfileId(remaining[0]?.profile_id || "");
    }
  };

  const sendMessage = async (messageText = query) => {
    const cleanQuery = messageText.trim();
    if (!cleanQuery || !activeProfile || sending) return;

    setError("");
    setQuery("");
    const priorMessages = messages.slice(-10);
    const userMessage = { role: "user", content: cleanQuery };
    setConversations((current) => ({
      ...current,
      [activeProfileId]: [...(current[activeProfileId] || []), userMessage],
    }));
    setSending(true);

    try {
      const result = await chatWithProfile(userId, {
        profile_id: activeProfileId,
        query: cleanQuery,
        history: priorMessages,
      });
      setConversations((current) => ({
        ...current,
        [activeProfileId]: [
          ...(current[activeProfileId] || []),
          { role: "assistant", content: result.response },
        ],
      }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSending(false);
    }
  };

  const runHealthCheck = async () => {
    setHealth("checking");
    try {
      await checkHealth();
      setHealth("online");
    } catch {
      setHealth("offline");
    }
  };

  const clearConversation = () => {
    if (!activeProfileId) return;
    setConversations((current) => ({ ...current, [activeProfileId]: [] }));
  };

  return (
    <div className="flex min-h-screen bg-[#f7f8fc] text-slate-800 dark:bg-[#080b14] dark:text-slate-100">
      <ProfileSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((value) => !value)}
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSelect={setActiveProfileId}
        onDelete={deleteProfile}
        onImport={() => setImportOpen(true)}
        onSettings={() => setSettingsOpen(true)}
      />

      {mobileMenu && (
        <div className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden">
          <div className="h-full w-[86%] max-w-sm bg-white p-5 shadow-2xl dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <Logo />
              <button
                onClick={() => setMobileMenu(false)}
                className="rounded-xl p-2 text-slate-400"
              >
                <X size={20} />
              </button>
            </div>
            <button
              onClick={() => {
                setImportOpen(true);
                setMobileMenu(false);
              }}
              className="mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 font-semibold text-white"
            >
              <Plus size={18} /> Import profile
            </button>
            <div className="mt-6 space-y-2">
              {profiles.map((profile) => (
                <button
                  key={profile.profile_id}
                  onClick={() => {
                    setActiveProfileId(profile.profile_id);
                    setMobileMenu(false);
                  }}
                  className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold ${
                    activeProfileId === profile.profile_id
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {profile.profile_owner}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/75 px-4 backdrop-blur-xl dark:border-white/8 dark:bg-slate-950/60 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileMenu(true)}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/8 lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="truncate font-display text-base font-bold text-slate-950 dark:text-white sm:text-lg">
                {activeProfile?.profile_owner || "Icebreaker workspace"}
              </h1>
              <p className="truncate text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              title={
                health === "online"
                  ? "Backend online"
                  : "Connection not checked"
              }
              className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300 sm:flex"
            >
              <span
                className={`size-2 rounded-full ${
                  health === "online"
                    ? "bg-emerald-500"
                    : health === "offline"
                      ? "bg-rose-500"
                      : "bg-amber-400"
                }`}
              />
              {health === "online"
                ? "Connected"
                : health === "offline"
                  ? "Offline"
                  : "Local API"}
            </div>
            {activeProfile && messages.length > 0 && (
              <button
                onClick={clearConversation}
                title="Clear conversation"
                className="rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/8 dark:hover:text-white"
              >
                <RotateCcw size={18} />
              </button>
            )}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/8 dark:hover:text-white"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.08),transparent_34%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.12),transparent_34%)]" />
          {!activeProfile ? (
            <EmptyWorkspace onImport={() => setImportOpen(true)} />
          ) : messages.length === 0 ? (
            <ProfileWelcome
              profile={activeProfile}
              onPrompt={sendMessage}
              onImport={() => setImportOpen(true)}
            />
          ) : (
            <Conversation
              messages={messages}
              sending={sending}
              profile={activeProfile}
              messagesEnd={messagesEnd}
            />
          )}

          {activeProfile && (
            <Composer
              query={query}
              onQueryChange={setQuery}
              onSend={() => sendMessage()}
              sending={sending}
              error={error}
            />
          )}
        </section>
      </main>

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        userId={userId}
        onImported={handleImported}
      />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        userId={userId}
        onUserIdChange={setUserId}
        health={health}
        onHealthCheck={runHealthCheck}
      />
    </div>
  );
}

function EmptyWorkspace({ onImport }) {
  return (
    <div className="relative z-10 flex flex-1 items-center justify-center overflow-y-auto px-5 py-12">
      <div className="max-w-xl text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-indigo-100 bg-white text-indigo-600 shadow-xl shadow-indigo-100/70 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:shadow-none">
          <UserRoundSearch size={28} />
        </div>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.13em] text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
          <Sparkles size={13} /> Profile-grounded AI
        </div>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
          Turn research into a memorable first line.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-slate-500 dark:text-slate-400 sm:text-base">
          Import a consented profile PDF, paste professional details, or add a
          profile manually. FirstLine finds the specifics worth talking about.
        </p>
        <button
          onClick={onImport}
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-600/25 transition hover:-translate-y-0.5 hover:bg-indigo-500"
        >
          <FileUp size={18} /> Import your first profile
        </button>
        <div className="mt-9 grid grid-cols-3 gap-3 text-left">
          {[
            ["01", "Import", "PDF, text, or structured data"],
            ["02", "Explore", "Ask about their professional story"],
            ["03", "Connect", "Craft a specific, natural opener"],
          ].map(([number, title, body]) => (
            <div
              key={number}
              className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-white/8 dark:bg-white/[0.025]"
            >
              <div className="text-xs font-bold text-indigo-500">{number}</div>
              <div className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                {title}
              </div>
              <div className="mt-1 hidden text-xs leading-5 text-slate-400 sm:block">
                {body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileWelcome({ profile, onPrompt, onImport }) {
  return (
    <div className="relative z-10 flex flex-1 items-center justify-center overflow-y-auto px-5 py-10">
      <div className="w-full max-w-3xl">
        <div className="text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-xl shadow-indigo-600/25">
            {profile.profile_owner.charAt(0).toUpperCase()}
          </div>
          <h2 className="mt-5 font-display text-2xl font-bold text-slate-950 dark:text-white sm:text-3xl">
            What would you like to know about {profile.profile_owner}?
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Choose a starting point or ask your own profile-grounded question.
          </p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {suggestions.map(({ icon: Icon, title, prompt }) => (
            <button
              key={title}
              onClick={() => onPrompt(prompt)}
              className="group rounded-2xl border border-slate-200/80 bg-white/80 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50 dark:border-white/8 dark:bg-white/[0.035] dark:hover:border-indigo-500/30 dark:hover:shadow-none"
            >
              <div className="flex items-start gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-500/10 dark:text-indigo-300">
                  <Icon size={17} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {title}
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">
                    {prompt}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={onImport}
          className="mx-auto mt-6 flex items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-indigo-600"
        >
          <Plus size={14} /> Import another profile
        </button>
      </div>
    </div>
  );
}

function Conversation({ messages, sending, profile, messagesEnd }) {
  return (
    <div className="relative z-10 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl space-y-7 px-5 py-8 sm:px-8">
        {messages.map((message, index) => (
          <Message
            key={`${message.role}-${index}`}
            message={message}
            profile={profile}
          />
        ))}
        {sending && (
          <div className="flex items-start gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white">
              <Sparkles size={15} />
            </div>
            <div className="flex gap-1 rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
              <span className="typing-dot" />
              <span className="typing-dot [animation-delay:150ms]" />
              <span className="typing-dot [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>
    </div>
  );
}

function Message({ message }) {
  const [copied, setCopied] = useState(false);
  const assistant = message.role === "assistant";

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  if (!assistant) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[86%] rounded-2xl rounded-br-md bg-slate-900 px-4 py-3 text-sm leading-6 text-white shadow-md dark:bg-indigo-600">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-3">
      <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
        <Sparkles size={15} />
      </div>
      <div className="min-w-0 max-w-[90%]">
        <div className="whitespace-pre-wrap rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3.5 text-sm leading-7 text-slate-700 shadow-sm dark:border-white/8 dark:bg-white/[0.04] dark:text-slate-200">
          {message.content}
        </div>
        <button
          onClick={copy}
          className="mt-1.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold text-slate-300 opacity-0 transition hover:text-indigo-500 group-hover:opacity-100"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy response"}
        </button>
      </div>
    </div>
  );
}

function Composer({ query, onQueryChange, onSend, sending, error }) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <div className="relative z-20 shrink-0 bg-gradient-to-t from-[#f7f8fc] via-[#f7f8fc] to-transparent px-4 pb-5 pt-7 dark:from-[#080b14] dark:via-[#080b14] sm:px-6">
      <div className="mx-auto max-w-3xl">
        {error && (
          <div className="mb-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/8 dark:text-rose-300">
            {error}
          </div>
        )}
        <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 pl-4 shadow-xl shadow-slate-200/50 transition focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-500/8 dark:border-white/10 dark:bg-slate-900 dark:shadow-none dark:focus-within:border-indigo-500/40">
          <textarea
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask for an icebreaker, insight, or thoughtful question..."
            className="max-h-32 min-h-11 flex-1 resize-none bg-transparent py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
          <button
            onClick={onSend}
            disabled={!query.trim() || sending}
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none dark:disabled:bg-white/8"
          >
            <ArrowUp size={19} strokeWidth={2.4} />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-slate-400">
          FirstLine answers only from the imported profile. Review before
          sending.
        </p>
      </div>
    </div>
  );
}

export default App;
