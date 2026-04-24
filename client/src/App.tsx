import { useState } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { TaskCreation } from "./components/TaskCreation";
import { TaskList } from "./components/TaskList";
import { AssigneeManager } from "./components/AssigneeManager";

function App() {
  const { user, signIn, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<"tasks" | "new" | "assignees">("tasks");

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <header className="navbar bg-base-100 shadow-sm sticky top-0 z-50">
        <div className="navbar-start">
          <a className="btn btn-ghost text-xl">
            <span className="text-primary">📦</span>
            Delegate
          </a>
        </div>
        <div className="navbar-end gap-2">
          <AuthLoading>
            <span className="loading loading-spinner loading-sm"></span>
          </AuthLoading>
          <Authenticated>
            <div className="flex items-center gap-4">
              <span className="text-sm text-base-content/70 hidden sm:inline">{user?.email}</span>
              <button onClick={() => signOut()} className="btn btn-ghost btn-sm">
                Sign out
              </button>
            </div>
          </Authenticated>
          <Unauthenticated>
            <button onClick={() => signIn()} className="btn btn-primary btn-sm">
              Sign in
            </button>
          </Unauthenticated>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Unauthenticated>
          <div className="hero min-h-[60vh]">
            <div className="hero-content text-center">
              <div className="max-w-md">
                <h1 className="text-5xl font-bold mb-6">📦 Delegate</h1>
                <p className="text-xl mb-8 text-base-content/70">
                  Lightweight delegation for small business owners. Create tasks, assign them via
                  email, and ensure completion with automated reminders.
                </p>
                <button onClick={() => signIn()} className="btn btn-primary btn-lg">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </Unauthenticated>

        <Authenticated>
          <div className="flex flex-col gap-6">
            {/* Navigation Tabs */}
            <div className="tabs tabs-boxed justify-center sm:justify-start">
              <button
                className={`tab ${activeTab === "tasks" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("tasks")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
                My Tasks
              </button>
              <button
                className={`tab ${activeTab === "new" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("new")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                New Task
              </button>
              <button
                className={`tab ${activeTab === "assignees" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("assignees")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                Assignees
              </button>
            </div>

            {/* Tab Content */}
            <div className="bg-base-100 rounded-box shadow-sm p-6">
              {activeTab === "tasks" && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">My Tasks</h2>
                  <TaskList />
                </div>
              )}

              {activeTab === "new" && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Create New Task</h2>
                  <TaskCreation onSuccess={() => setActiveTab("tasks")} />
                </div>
              )}

              {activeTab === "assignees" && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Manage Assignees</h2>
                  <AssigneeManager onClose={() => setActiveTab("tasks")} />
                </div>
              )}
            </div>
          </div>
        </Authenticated>
      </main>
    </div>
  );
}

export default App;
