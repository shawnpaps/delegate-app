import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTask, type ParsedTask } from "@/hooks/useTask";
import { TaskCard } from "@/components/TaskCard";
import { MicButton } from "@/components/MicButton";
import { VoiceConfirmModal } from "@/components/VoiceConfirmModal";

type Tab = "all" | "active" | "awaiting_response" | "completed";

const tabs: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "awaiting_response", label: "Awaiting Response" },
  { key: "completed", label: "Completed" },
];

export function Dashboard() {
  const { tasks, loading, error, fetchTasks, createTask, parseTask } =
    useTask();
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [textInput, setTextInput] = useState("");
  const [parsedResult, setParsedResult] = useState<ParsedTask | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTasks(activeTab);
  }, [activeTab, fetchTasks]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    try {
      const parsed = await parseTask(textInput.trim());
      setParsedResult(parsed);
      setShowModal(true);
    } catch {
      alert("Failed to parse task. Please try again.");
    }
  };

  const handleVoiceTranscript = useCallback(
    async (transcript: string) => {
      try {
        const parsed = await parseTask(transcript);
        parsed.raw_input = transcript;
        setParsedResult(parsed);
        setShowModal(true);
      } catch {
        alert("Failed to parse task. Please try again.");
      }
    },
    [parseTask]
  );

  const handleConfirm = async (edited: ParsedTask) => {
    setCreating(true);
    try {
      await createTask(edited);
      setShowModal(false);
      setParsedResult(null);
      setTextInput("");
    } catch {
      alert("Failed to create task.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          to="/settings"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Settings
        </Link>
      </div>

      {/* Voice input */}
      <div className="mb-6 flex justify-center">
        <MicButton onTranscript={handleVoiceTranscript} />
      </div>

      {/* Text input */}
      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Type a task... e.g. Ask John to send the invoice by Friday"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
        />
        <button
          onClick={handleTextSubmit}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Parse
        </button>
      </div>

      {/* Tab filter */}
      <div className="mb-4 flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        </div>
      )}

      {error && (
        <p className="py-8 text-center text-sm text-red-500">{error}</p>
      )}

      {!loading && tasks.length === 0 && (
        <p className="py-12 text-center text-sm text-gray-400">
          No tasks yet. Use the mic or type to create one.
        </p>
      )}

      <div className="space-y-3">
        {tasks.map((task) => (
          <Link key={task.id} to={`/tasks/${task.id}`}>
            <TaskCard task={task} />
          </Link>
        ))}
      </div>

      {/* Confirmation modal */}
      {showModal && parsedResult && (
        <VoiceConfirmModal
          parsed={parsedResult}
          onConfirm={handleConfirm}
          onCancel={() => {
            setShowModal(false);
            setParsedResult(null);
          }}
        />
      )}

      {creating && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      )}
    </div>
  );
}
