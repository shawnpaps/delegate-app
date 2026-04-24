import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// HTTP endpoint to complete a task via email webhook
http.route({
  path: "/complete-task",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { emailToken } = body;

      if (!emailToken) {
        return new Response(JSON.stringify({ error: "Missing emailToken" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Call the action to complete the task
      const result = await ctx.runAction(api.actions.completeViaWebhook, {
        emailToken,
      });

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error completing task:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// HTTP endpoint to get task by email token
http.route({
  path: "/task-by-token",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const emailToken = url.searchParams.get("emailToken");

      if (!emailToken) {
        return new Response(JSON.stringify({ error: "Missing emailToken" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const task = await ctx.runQuery(api.tasks.byEmailToken, {
        emailToken,
      });

      if (!task) {
        return new Response(JSON.stringify({ error: "Task not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(task), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching task:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// HTTP endpoint to get pending reminders
http.route({
  path: "/pending-reminders",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const now = Date.now();

      const tasks = await ctx.runQuery(api.tasks.getPendingTasksForReminders, {
        now,
      });

      return new Response(JSON.stringify(tasks), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching pending reminders:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
