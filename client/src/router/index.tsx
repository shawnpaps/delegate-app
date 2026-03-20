import { Routes, Route, Navigate } from "react-router-dom";
import { Home } from "@/pages/Home";
import { Dashboard } from "@/pages/Dashboard";
import { TaskDetail } from "@/pages/TaskDetail";
import { Onboarding } from "@/pages/Onboarding";
import { Settings } from "@/pages/Settings";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/tasks/:id" element={<TaskDetail />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
