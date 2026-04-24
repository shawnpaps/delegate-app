import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface TaskCreationProps {
  onSuccess?: () => void;
}

export function TaskCreation({ onSuccess }: TaskCreationProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeEmail, setAssigneeEmail] = useState("");
  const [assigneeName, setAssigneeName] = useState("");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<Id<"assignees"> | "">("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewAssignee, setShowNewAssignee] = useState(false);

  const createTask = useMutation(api.tasks.create);
  const createAssignee = useMutation(api.assignees.create);
  const assignees = useQuery(api.assignees.list) ?? [];

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "new") {
      setShowNewAssignee(true);
      setSelectedAssigneeId("");
      setAssigneeEmail("");
      setAssigneeName("");
    } else if (value) {
      setShowNewAssignee(false);
      setSelectedAssigneeId(value as Id<"assignees">);
      const assignee = assignees.find((a) => a._id === value);
      if (assignee) {
        setAssigneeEmail(assignee.email);
        setAssigneeName(assignee.name);
      }
    } else {
      setShowNewAssignee(false);
      setSelectedAssigneeId("");
      setAssigneeEmail("");
      setAssigneeName("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !assigneeEmail || !reminderDate || !reminderTime) return;

    setIsSubmitting(true);

    try {
      // Save new assignee if entered
      if (showNewAssignee && assigneeName && assigneeEmail) {
        await createAssignee({
          name: assigneeName,
          email: assigneeEmail,
        });
      }

      // Combine date and time
      const reminderAt = new Date(`${reminderDate}T${reminderTime}`).getTime();

      await createTask({
        title,
        description: description || undefined,
        assigneeEmail,
        assigneeName: assigneeName || undefined,
        reminderAt,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setAssigneeEmail("");
      setAssigneeName("");
      setSelectedAssigneeId("");
      setReminderDate("");
      setReminderTime("");
      setShowNewAssignee(false);

      onSuccess?.();
    } catch (error) {
      console.error("Failed to create task:", error);
      alert("Failed to create task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Info Bento */}
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-lg flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                />
              </svg>
              Task Information
            </h3>
            <div className="form-control w-full mt-4">
              <label className="label">
                <span className="label-text">Task Title</span>
              </label>
              <input
                type="text"
                placeholder="Enter task title"
                className="input input-bordered w-full"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Description (optional)</span>
              </label>
              <textarea
                placeholder="Add details about the task"
                className="textarea textarea-bordered w-full h-24"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Assignee Bento */}
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-lg flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
              Assignee
            </h3>
            <div className="form-control w-full mt-4">
              <label className="label">
                <span className="label-text">Select or Add Assignee</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={showNewAssignee ? "new" : selectedAssigneeId}
                onChange={handleAssigneeChange}
              >
                <option value="">Choose an assignee...</option>
                {assignees.map((assignee) => (
                  <option key={assignee._id} value={assignee._id}>
                    {assignee.name} ({assignee.email})
                  </option>
                ))}
                <option value="new">+ Add new assignee</option>
              </select>
            </div>

            {(showNewAssignee || !selectedAssigneeId) && (
              <div className="space-y-4 mt-2">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Assignee name"
                    className="input input-bordered w-full"
                    value={assigneeName}
                    onChange={(e) => setAssigneeName(e.target.value)}
                    required={showNewAssignee}
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    placeholder="assignee@example.com"
                    className="input input-bordered w-full"
                    value={assigneeEmail}
                    onChange={(e) => setAssigneeEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reminder Bento */}
        <div className="card bg-base-100 border border-base-200 shadow-sm lg:col-span-2">
          <div className="card-body">
            <h3 className="card-title text-lg flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              Reminder Schedule
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Date</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Time</span>
                </label>
                <input
                  type="time"
                  className="input input-bordered w-full"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Creating...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Create Task
            </>
          )}
        </button>
      </div>
    </form>
  );
}
