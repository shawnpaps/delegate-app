import type { Task } from "@/hooks/useTask";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

const statusColors: Record<string, string> = {
  active: "bg-blue-100 text-blue-800",
  awaiting_response: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  snoozed: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  awaiting_response: "Awaiting Response",
  completed: "Completed",
  snoozed: "Snoozed",
};

function formatCountdown(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff < 0) return "Overdue";
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  return `${hours}h`;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-gray-900 truncate">{task.title}</h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[task.status]}`}
        >
          {statusLabels[task.status]}
        </span>
      </div>

      {task.assignee_name && (
        <p className="mt-1 text-sm text-gray-500">
          Assigned to: {task.assignee_name}
        </p>
      )}

      <div className="mt-2 flex gap-4 text-xs text-gray-400">
        {task.due_at && (
          <span>Due: {new Date(task.due_at).toLocaleDateString()}</span>
        )}
        <span>Follow-up in: {formatCountdown(task.follow_up_at)}</span>
      </div>
    </button>
  );
}
