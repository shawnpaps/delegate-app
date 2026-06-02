import { useState, useEffect, type ReactNode } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import { Authenticated, Unauthenticated, AuthLoading, useConvexAuth } from "convex/react";
import { TaskCreation } from "./components/TaskCreation";
import { TaskList } from "./components/TaskList";
import { AssigneeManager } from "./components/AssigneeManager";

type ActiveTab = "tasks" | "new" | "assignees";

const tabs: Array<{
  id: ActiveTab;
  label: string;
  icon: ReactNode;
}> = [
  {
    id: "tasks",
    label: "Tasks",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
        <path
          fillRule="evenodd"
          d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: "new",
    label: "New Task",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: "assignees",
    label: "People",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
      </svg>
    ),
  },
];

const pageCopy: Record<ActiveTab, { eyebrow: string; title: string; description: string }> = {
  tasks: {
    eyebrow: "Command center",
    title: "Delegated work",
    description: "Track open commitments, reminder timing, and recently completed work.",
  },
  new: {
    eyebrow: "Create assignment",
    title: "Delegate a task",
    description: "Capture the outcome, owner, and reminder window in one pass.",
  },
  assignees: {
    eyebrow: "Team directory",
    title: "Manage assignees",
    description: "Keep the people you delegate to ready for quick task assignment.",
  },
};

function App() {
  const { user, signIn, signOut, getAccessToken } = useAuth();
  const convexAuth = useConvexAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("tasks");

  useEffect(() => {
    const tag = "[AuthDiag]";
    console.log(tag, "authkit user:", !!user, "| convex isLoading:", convexAuth.isLoading, "| convex isAuthenticated:", convexAuth.isAuthenticated);
    if (!user) return;
    getAccessToken()
      .then((token) => {
        console.log(tag, "getAccessToken() succeeded, token length:", token?.length ?? 0);
        const parts = token?.split(".");
        if (parts?.length === 3) {
          try {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
            console.log(tag, "JWT iss:", payload.iss, "| aud:", payload.aud, "| sub:", String(payload.sub ?? "").slice(0, 12) + "...");
          } catch {
            console.log(tag, "JWT payload decode failed");
          }
        }
      })
      .catch((err: Error) => {
        console.log(tag, "getAccessToken() failed:", err.name, "-", err.message);
      });
  }, [user, convexAuth.isAuthenticated, getAccessToken]);
  const copy = pageCopy[activeTab];

  return (
    <div className="app-shell min-h-screen">
      <header className="sticky top-0 z-50 border-b border-base-300/70 bg-base-100/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a className="flex items-center gap-3" href="/" aria-label="Delegate home">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 8.5h10M7 12h7M7 15.5h5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M5.5 3.75h13A2.75 2.75 0 0121.25 6.5v11a2.75 2.75 0 01-2.75 2.75h-13A2.75 2.75 0 012.75 17.5v-11A2.75 2.75 0 015.5 3.75z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </span>
            <span>
              <span className="block text-base font-semibold leading-5 text-base-content">
                Delegate
              </span>
              <span className="hidden text-xs font-medium uppercase tracking-[0.18em] text-base-content/45 sm:block">
                Task handoff
              </span>
            </span>
          </a>

          <div className="flex items-center gap-2">
            <AuthLoading>
              <span className="loading loading-spinner loading-sm text-primary"></span>
            </AuthLoading>
            <Authenticated>
              <span className="hidden max-w-64 truncate rounded-full border border-base-300 bg-base-200/70 px-3 py-1.5 text-sm text-base-content/65 md:inline">
                {user?.email}
              </span>
              <button onClick={() => signOut()} className="btn btn-ghost btn-sm">
                Sign out
              </button>
            </Authenticated>
            <Unauthenticated>
              <button onClick={() => signIn()} className="btn btn-primary btn-sm">
                Sign in
              </button>
            </Unauthenticated>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Unauthenticated>
          <section className="grid min-h-[68vh] items-center gap-10 lg:grid-cols-[1fr_0.85fr]">
            <div className="max-w-2xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Delegate
              </p>
              <h1 className="max-w-xl text-5xl font-semibold leading-[1.02] tracking-normal text-base-content sm:text-6xl">
                Task handoffs that stay visible.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-base-content/65">
                Lightweight delegation for small business owners. Create tasks, assign them by
                email, and keep accountability moving with reminders.
              </p>
              <button onClick={() => signIn()} className="btn btn-primary mt-8">
                Get started
              </button>
            </div>

            <div className="preview-panel">
              <div className="preview-row">
                <span className="status-dot bg-warning"></span>
                <div>
                  <p className="font-semibold">Follow up on vendor quote</p>
                  <p className="text-sm text-base-content/55">Assigned to Alex - reminder today</p>
                </div>
              </div>
              <div className="preview-row">
                <span className="status-dot bg-success"></span>
                <div>
                  <p className="font-semibold">Send updated invoice packet</p>
                  <p className="text-sm text-base-content/55">Completed by Morgan</p>
                </div>
              </div>
              <div className="preview-row">
                <span className="status-dot bg-primary"></span>
                <div>
                  <p className="font-semibold">Schedule site walkthrough</p>
                  <p className="text-sm text-base-content/55">Assigned to Priya - reminder Friday</p>
                </div>
              </div>
            </div>
          </section>
        </Unauthenticated>

        <Authenticated>
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <aside className="sidebar-panel">
              <nav className="grid gap-2" aria-label="Primary">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`nav-item ${activeTab === tab.id ? "nav-item-active" : ""}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="nav-icon">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </aside>

            <section className="content-panel">
              <div className="mb-7 flex flex-col justify-between gap-4 border-b border-base-300 pb-6 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    {copy.eyebrow}
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-normal text-base-content">
                    {copy.title}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-base-content/60">
                    {copy.description}
                  </p>
                </div>
                {activeTab !== "new" && (
                  <button onClick={() => setActiveTab("new")} className="btn btn-primary btn-sm">
                    New task
                  </button>
                )}
              </div>

              {activeTab === "tasks" && <TaskList />}
              {activeTab === "new" && <TaskCreation onSuccess={() => setActiveTab("tasks")} />}
              {activeTab === "assignees" && <AssigneeManager onClose={() => setActiveTab("tasks")} />}
            </section>
          </div>
        </Authenticated>
      </main>
    </div>
  );
}

export default App;
