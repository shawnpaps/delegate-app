import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

interface AssigneeManagerProps {
  onClose?: () => void;
}

export function AssigneeManager({ onClose }: AssigneeManagerProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const assignees: Doc<"assignees">[] = useQuery(api.assignees.list) ?? [];
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
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="form-panel">
        <div className="form-panel-header">
          <span className="panel-icon panel-icon-accent" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM3 18a5 5 0 0110 0H3zM15 7a1 1 0 011 1v2h2a1 1 0 110 2h-2v2a1 1 0 11-2 0v-2h-2a1 1 0 110-2h2V8a1 1 0 011-1z" />
            </svg>
          </span>
          <div>
            <h3>Add assignee</h3>
            <p>Save trusted contacts for faster delegation.</p>
          </div>
        </div>
        <div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div className="mt-5 flex justify-end">
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
        <section className="directory-panel">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Directory</p>
              <h3 className="text-lg font-semibold text-base-content">Saved assignees</h3>
            </div>
            <span className="count-pill">{assignees.length}</span>
          </div>
          <div className="overflow-x-auto">
              <table className="table table-sm">
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
                          title="Remove assignee"
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
        </section>
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
