import { useState } from "react";
import type { ParsedTask } from "@/hooks/useTask";

interface VoiceConfirmModalProps {
  parsed: ParsedTask;
  onConfirm: (edited: ParsedTask) => void;
  onCancel: () => void;
}

export function VoiceConfirmModal({
  parsed,
  onConfirm,
  onCancel,
}: VoiceConfirmModalProps) {
  const [form, setForm] = useState<ParsedTask>(parsed);

  const handleChange = (field: keyof ParsedTask, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Confirm Task Details
        </h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Task
            </label>
            <input
              type="text"
              value={form.task}
              onChange={(e) => handleChange("task", e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Assignee
            </label>
            <input
              type="text"
              value={form.assignee}
              onChange={(e) => handleChange("assignee", e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contact (email or phone)
            </label>
            <input
              type="text"
              value={form.contact}
              onChange={(e) => handleChange("contact", e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Due Date
            </label>
            <input
              type="datetime-local"
              value={form.due_at}
              onChange={(e) => handleChange("due_at", e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Follow-up Date
            </label>
            <input
              type="datetime-local"
              value={form.follow_up_at}
              onChange={(e) => handleChange("follow_up_at", e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <p className="mt-3 text-xs text-gray-400">
          Raw input: &ldquo;{form.raw_input}&rdquo;
        </p>

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(form)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}
