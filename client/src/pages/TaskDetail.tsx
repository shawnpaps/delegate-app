import { useParams, useNavigate } from "react-router-dom";
import { useTask } from "@/hooks/useTask";

export function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { task, responses, loading, error, updateTask, deleteTask } = useTask(id);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-red-500">{error || "Task not found"}</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const handleStatusChange = async (
    status: "active" | "awaiting_response" | "completed" | "snoozed"
  ) => {
    await updateTask(task.id, { status });
  };

  const handleSnooze = async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    await updateTask(task.id, { follow_up_at: tomorrow, status: "snoozed" });
  };

  const handleDelete = async () => {
    if (!confirm("Delete this task?")) return;
    await deleteTask(task.id);
    navigate("/dashboard");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-4 text-sm text-gray-500 hover:text-gray-700"
      >
        ← Back
      </button>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex gap-4">
            <dt className="w-32 text-gray-500">Assignee</dt>
            <dd className="text-gray-900">{task.assignee_name || "—"}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-32 text-gray-500">Contact</dt>
            <dd className="text-gray-900">
              {task.assignee_email || task.assignee_phone || "—"}
            </dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-32 text-gray-500">Due</dt>
            <dd className="text-gray-900">
              {task.due_at
                ? new Date(task.due_at).toLocaleString()
                : "—"}
            </dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-32 text-gray-500">Follow-up</dt>
            <dd className="text-gray-900">
              {task.follow_up_at
                ? new Date(task.follow_up_at).toLocaleString()
                : "—"}
            </dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-32 text-gray-500">Status</dt>
            <dd className="text-gray-900 capitalize">
              {task.status.replace("_", " ")}
            </dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-32 text-gray-500">Created</dt>
            <dd className="text-gray-900">
              {new Date(task.created_at).toLocaleString()}
            </dd>
          </div>
        </dl>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-2">
          {task.status !== "completed" && (
            <button
              onClick={() => handleStatusChange("completed")}
              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
            >
              Mark Complete
            </button>
          )}
          {task.status !== "snoozed" && (
            <button
              onClick={handleSnooze}
              className="rounded-md bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-300"
            >
              Snooze 1 Day
            </button>
          )}
          {task.status !== "awaiting_response" && (
            <button
              onClick={() => handleStatusChange("awaiting_response")}
              className="rounded-md bg-yellow-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-600"
            >
              Awaiting Response
            </button>
          )}
          <button
            onClick={handleDelete}
            className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-200"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Assignee responses */}
      {responses.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Assignee Responses
          </h2>
          <div className="space-y-3">
            {responses.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase text-gray-400">
                    {r.channel}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(r.received_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-700">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
