import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function TaskList() {
  const tasks = useQuery(api.tasks.list) ?? [];
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
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-semibold text-base-content/70">No tasks yet</h3>
        <p className="text-base-content/50 mt-2">Create your first task to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="badge badge-warning badge-sm"></span>
            Pending ({pendingTasks.length})
          </h3>
          <div className="grid gap-4">
            {pendingTasks.map((task) => (
              <div key={task._id} className="card bg-base-100 border border-warning/20 shadow-sm">
                <div className="card-body p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-base truncate">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-base-content/70 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="badge badge-ghost badge-sm flex items-center gap-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {task.assigneeName || task.assigneeEmail}
                        </span>
                        <span className="badge badge-warning badge-sm flex items-center gap-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => completeTask({ taskId: task._id })}
                        className="btn btn-success btn-sm"
                        title="Mark as complete"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Complete
                      </button>
                      <div className="badge badge-warning">Pending</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="badge badge-success badge-sm"></span>
            Completed ({completedTasks.length})
          </h3>
          <div className="grid gap-4 opacity-60">
            {completedTasks.map((task) => (
              <div key={task._id} className="card bg-base-100 border border-base-200 shadow-sm">
                <div className="card-body p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-base truncate line-through">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-sm text-base-content/70 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="badge badge-ghost badge-sm flex items-center gap-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
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
                    <div className="badge badge-success">Done</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
