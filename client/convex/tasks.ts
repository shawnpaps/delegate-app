import { v } from "convex/values";
import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { api } from "./_generated/api";

// Public mutation to create a task
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    assigneeEmail: v.string(),
    assigneeName: v.optional(v.string()),
    reminderAt: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Debug: Log the full identity object to see available fields
    console.log("[DEBUG] WorkOS Identity:", JSON.stringify(identity, null, 2));

    // Get or create user
    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .unique();

    // Extract email from various possible locations in identity
    const userEmail = identity.email || 
                      (identity as any).user?.email || 
                      (identity as any).user?.emails?.[0] || 
                      "";
    
    const userName = identity.name || 
                     (identity as any).user?.name || 
                     userEmail || 
                     "";

    console.log("[DEBUG] Extracted email:", userEmail, "name:", userName);

    let userId;
    if (!user) {
      userId = await ctx.db.insert("users", {
        workosId: identity.subject,
        email: userEmail,
        name: userName,
      });
      console.log("[DEBUG] Created new user:", userId, "with email:", userEmail);
    } else {
      userId = user._id;
      // Update user if email/name is missing
      if (!user.email || user.email === "" || !user.name || user.name === "") {
        await ctx.db.patch(userId, {
          email: userEmail || user.email,
          name: userName || user.name,
        });
        console.log("[DEBUG] Updated existing user:", userId, "with email:", userEmail);
      }
    }

    // Generate unique token for email completion
    const emailToken = crypto.randomUUID();

    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      creatorId: userId,
      assigneeEmail: args.assigneeEmail,
      assigneeName: args.assigneeName,
      reminderAt: args.reminderAt,
      status: "pending",
      emailToken,
      createdAt: Date.now(),
    });

    // Schedule email sending via action
    // Use the extracted email/name (not from DB) to ensure we have the values
    await ctx.scheduler.runAfter(0, api.actions.sendAssigneeEmail, {
      taskId,
      assigneeEmail: args.assigneeEmail,
      assigneeName: args.assigneeName,
      creatorName: userName,
      creatorEmail: userEmail,
      emailToken,
      title: args.title,
      description: args.description,
    });
    console.log("[DEBUG] Scheduled email with creatorEmail:", userEmail, "creatorName:", userName);

    return { taskId, emailToken };
  },
});

// Public query to list user's tasks
export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_creator", (q) => q.eq("creatorId", user._id))
      .order("desc")
      .take(100);

    return tasks;
  },
});

// Public query to get pending tasks
export const pending = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("tasks")
      .withIndex("by_creator_and_status", (q) =>
        q.eq("creatorId", user._id).eq("status", "pending"),
      )
      .order("desc")
      .take(100);
  },
});

// Public query to get a single task
export const get = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .unique();

    if (!user) {
      return null;
    }

    const task = await ctx.db.get(args.taskId);
    if (!task || task.creatorId !== user._id) {
      return null;
    }

    return task;
  },
});

// Public query to get task by email token
export const byEmailToken = query({
  args: {
    emailToken: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_emailToken", (q) => q.eq("emailToken", args.emailToken))
      .unique();
  },
});

// Public mutation to complete a task by ID (called from UI)
export const completeById = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get task and verify ownership
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    if (task.creatorId !== user._id) {
      throw new Error("Not authorized to complete this task");
    }

    if (task.status === "completed") {
      return { success: true, alreadyCompleted: true };
    }

    await ctx.db.patch(args.taskId, {
      status: "completed",
    });

    return { success: true, alreadyCompleted: false };
  },
});

// Internal mutation to complete a task (can be called from actions)
export const complete = internalMutation({
  args: {
    emailToken: v.string(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db
      .query("tasks")
      .withIndex("by_emailToken", (q) => q.eq("emailToken", args.emailToken))
      .unique();

    if (!task) {
      throw new Error("Task not found");
    }

    if (task.status === "completed") {
      return { success: true, alreadyCompleted: true };
    }

    await ctx.db.patch(task._id, {
      status: "completed",
    });

    return { success: true, alreadyCompleted: false };
  },
});

// Internal query to get pending tasks for reminders (used by action)
export const getPendingTasksForReminders = internalQuery({
  args: {
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_creator_and_status", (q) => q.eq("status", "pending"))
      .filter((q) => q.lt(q.field("reminderAt"), args.now))
      .take(100);

    // Get creator info for each task
    const tasksWithCreator = await Promise.all(
      tasks.map(async (task) => {
        const creator = await ctx.db.get(task.creatorId);
        return {
          ...task,
          creatorEmail: creator?.email || "",
        };
      }),
    );

    return tasksWithCreator;
  },
});
