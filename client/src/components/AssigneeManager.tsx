import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface AssigneeManagerProps {
  onClose?: () => void;
}

export function AssigneeManager({ onClose }: AssigneeManagerProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const assignees = useQuery(api.assignees.list) ?? [];
  const createAssignee = useMutation(api.assignees.create);
  const removeAssignee = useMutation(api.assignees.remove);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setIsSubmitting(true);

    try {
      await createAssignee({ name, email });
      setName("");
      setEmail("");
    } catch (error) {
      console.error("Failed to create assignee:", error);
      alert("Failed to save assignee. They may already exist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (assigneeId: Id<"assignees">) => {
    if (!confirm("Are you sure you want to remove this assignee?")) return;

    try {
      await removeAssignee({ assigneeId });
    } catch (error) {
      console.error("Failed to remove assignee:", error);
      alert("Failed to remove assignee.");
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="card bg-base-100 border border-base-200">
        <div className="card-body">
          <h4 className="card-title text-base">Add New Assignee</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Name</span>
              </label>
              <input
                type="text"
                placeholder="John Doe"
                className="input input-bordered input-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                className="input input-bordered input-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="card-actions justify-end mt-4">
            <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                "Add Assignee"
              )}
            </button>
          </div>
        </div>
      </form>

      {assignees.length > 0 && (
        <div className="card bg-base-100 border border-base-200">
          <div className="card-body">
            <h4 className="card-title text-base mb-4">Saved Assignees</h4>
            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {assignees.map((assignee) => (
                    <tr key={assignee._id}>
                      <td>{assignee.name}</td>
                      <td className="text-base-content/70">{assignee.email}</td>
                      <td>
                        <button
                          onClick={() => handleRemove(assignee._id)}
                          className="btn btn-ghost btn-xs text-error"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {onClose && (
        <div className="flex justify-end">
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            Close
          </button>
        </div>
      )}
    </div>
  );
}
