import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

export function TaskList() {
  const tasks: Doc<"tasks">[] = useQuery(api.tasks.list) ?? [];
  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const completeTask = useMutation(api.tasks.completeById);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M9 6h6M9 10h6M9 14h3"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
            <path
              d="M6.5 3.75h11A2.75 2.75 0 0120.25 6.5v11a2.75 2.75 0 01-2.75 2.75h-11A2.75 2.75 0 013.75 17.5v-11A2.75 2.75 0 016.5 3.75z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-base-content">No delegated tasks yet</h3>
        <p className="mt-2 text-base-content/55">Create a task and assign it to someone.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="stat-tile">
          <span className="stat-label">Open</span>
          <strong>{pendingTasks.length}</strong>
        </div>
        <div className="stat-tile">
          <span className="stat-label">Completed</span>
          <strong>{completedTasks.length}</strong>
        </div>
        <div className="stat-tile">
          <span className="stat-label">Total</span>
          <strong>{tasks.length}</strong>
        </div>
      </div>

      {pendingTasks.length > 0 && (
        <section>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Needs attention</p>
              <h2>Pending tasks</h2>
            </div>
            <span className="count-pill">{pendingTasks.length}</span>
          </div>

          <div className="grid gap-3">
            {pendingTasks.map((task) => (
              <article key={task._id} className="task-row task-row-pending">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-base font-semibold text-base-content">
                      {task.title}
                    </h3>
                    <span className="badge badge-warning badge-sm">Pending</span>
                  </div>
                  {task.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-base-content/62">
                      {task.description}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="metadata-chip">
                      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {task.assigneeName || task.assigneeEmail}
                    </span>
                    <span className="metadata-chip metadata-chip-warm">
                      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {formatDate(task.reminderAt)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => completeTask({ taskId: task._id })}
                  className="btn btn-success btn-sm shrink-0"
                  title="Mark as complete"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Complete
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {completedTasks.length > 0 && (
        <section>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Recently closed</p>
              <h2>Completed tasks</h2>
            </div>
            <span className="count-pill count-pill-success">{completedTasks.length}</span>
          </div>

          <div className="grid gap-3">
            {completedTasks.map((task) => (
              <article key={task._id} className="task-row task-row-complete">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-base font-semibold text-base-content/75 line-through">
                      {task.title}
                    </h3>
                    <span className="badge badge-success badge-sm">Done</span>
                  </div>
                  {task.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-base-content/50">
                      {task.description}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="metadata-chip">
                      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {task.assigneeName || task.assigneeEmail}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
