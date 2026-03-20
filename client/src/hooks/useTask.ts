import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  assignee_name: string | null;
  assignee_email: string | null;
  assignee_phone: string | null;
  due_at: string | null;
  follow_up_at: string | null;
  follow_up_sent_at: string | null;
  owner_notified_at: string | null;
  status: "active" | "awaiting_response" | "completed" | "snoozed";
  created_at: string;
  updated_at: string;
}

export interface TaskResponse {
  id: string;
  task_id: string;
  channel: "sms" | "email";
  body: string;
  received_at: string;
}

export interface ParsedTask {
  task: string;
  assignee: string;
  contact: string;
  due_at: string;
  follow_up_at: string;
  raw_input: string;
}

type TaskStatusFilter = "all" | "active" | "awaiting_response" | "completed";

export function useTask(taskId?: string) {
  const [task, setTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [responses, setResponses] = useState<TaskResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async (status: TaskStatusFilter = "all") => {
    setLoading(true);
    setError(null);
    try {
      const query = status !== "all" ? `?status=${status}` : "";
      const data = await apiGet<Task[]>(`/tasks${query}`);
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTask = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<Task>(`/tasks?id=${id}`);
      setTask(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch task");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchResponses = useCallback(async (id: string) => {
    try {
      const data = await apiGet<TaskResponse[]>(`/tasks?id=${id}&include=responses`);
      setResponses(data);
    } catch {
      // Responses may not exist yet
    }
  }, []);

  const createTask = useCallback(
    async (parsed: ParsedTask): Promise<Task> => {
      const data = await apiPost<Task>("/tasks", {
        title: parsed.task,
        assignee_name: parsed.assignee || null,
        assignee_email: parsed.contact.includes("@") ? parsed.contact : null,
        assignee_phone: !parsed.contact.includes("@") ? parsed.contact : null,
        due_at: parsed.due_at || null,
        follow_up_at: parsed.follow_up_at || null,
      });
      setTasks((prev) => [data, ...prev]);
      return data;
    },
    []
  );

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const data = await apiPatch<Task>("/tasks", { id, ...updates });
    setTask(data);
    setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
    return data;
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await apiDelete(`/tasks?id=${id}`);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const parseTask = useCallback(
    async (text: string): Promise<ParsedTask> => {
      return apiPost<ParsedTask>("/parse-task", { text });
    },
    []
  );

  useEffect(() => {
    if (taskId) {
      fetchTask(taskId);
      fetchResponses(taskId);
    }
  }, [taskId, fetchTask, fetchResponses]);

  return {
    task,
    tasks,
    responses,
    loading,
    error,
    fetchTasks,
    fetchTask,
    fetchResponses,
    createTask,
    updateTask,
    deleteTask,
    parseTask,
  };
}
