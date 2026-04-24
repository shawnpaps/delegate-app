"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { api } from "./_generated/api";

// Action to send assignee email (runs in background in Node.js runtime)
export const sendAssigneeEmail = internalAction({
  args: {
    taskId: v.id("tasks"),
    assigneeEmail: v.string(),
    assigneeName: v.optional(v.string()),
    creatorName: v.string(),
    creatorEmail: v.string(),
    emailToken: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    console.log(`[DEBUG] sendAssigneeEmail action started for task ${args.taskId}`);
    console.log(`[DEBUG] Backend URL: ${backendUrl}`);

    try {
      const requestBody = {
        to: args.assigneeEmail,
        taskTitle: args.title,
        taskDescription: args.description,
        creatorName: args.creatorName,
        creatorEmail: args.creatorEmail,
        emailToken: args.emailToken,
      };
      console.log(`[DEBUG] Request body:`, JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${backendUrl}/api/send-assignee-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`[DEBUG] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[DEBUG] Failed to send assignee email. Status: ${response.status}, Error: ${errorText}`);
        throw new Error(`Backend returned ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();
      console.log(`[DEBUG] Email sent successfully. Response:`, JSON.stringify(responseData, null, 2));
    } catch (error) {
      console.error(`[DEBUG] Error sending assignee email for task ${args.taskId}:`, error);
      console.error(`[DEBUG] Error stack:`, error instanceof Error ? error.stack : "No stack trace");
      // Re-throw the error so Convex knows the action failed
      throw error;
    }
  },
});

// Scheduled action to check and send reminders
export const checkAndSendReminders = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

    // Get pending tasks from the query
    const tasks = await ctx.runQuery(api.tasks.getPendingTasksForReminders, {
      now,
    });

    for (const task of tasks) {
      try {
        // Send reminder via backend
        await fetch(`${backendUrl}/api/send-reminder`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: task.creatorEmail,
            taskTitle: task.title,
            taskDescription: task.description,
            assigneeName: task.assigneeName,
            assigneeEmail: task.assigneeEmail,
            createdAt: new Date(task.createdAt).toLocaleDateString(),
          }),
        });
      } catch (error) {
        console.error(`Failed to send reminder for task ${task._id}:`, error);
      }
    }

    return { remindersSent: tasks.length };
  },
});

// Action to complete task via webhook (called from Hono backend)
export const completeViaWebhook = internalAction({
  args: {
    emailToken: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const result: { success: boolean; alreadyCompleted?: boolean } = await ctx.runMutation(
        api.tasks.complete,
        {
          emailToken: args.emailToken,
        },
      );

      if (result.success && !result.alreadyCompleted) {
        // Get task details for confirmation email
        const task = await ctx.runQuery(api.tasks.byEmailToken, {
          emailToken: args.emailToken,
        });

        if (task) {
          const creator = await ctx.runQuery(api.users.get, {
            userId: task.creatorId,
          });

          if (creator) {
            const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
            await fetch(`${backendUrl}/api/send-completion-confirmation`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                to: creator.email,
                taskTitle: task.title,
                assigneeName: task.assigneeName,
                assigneeEmail: task.assigneeEmail,
                completedAt: new Date().toLocaleString(),
              }),
            });
          }
        }
      }

      return result;
    } catch (error) {
      console.error("Error completing task via webhook:", error);
      throw error;
    }
  },
});
