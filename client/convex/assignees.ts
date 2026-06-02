import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./authUsers";

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }
    const userId = user._id;

    // Check if assignee with this email already exists for this user
    const existing = await ctx.db
      .query("assignees")
      .withIndex("by_user_and_email", (q) => q.eq("userId", userId).eq("email", args.email))
      .unique();

    if (existing) {
      throw new Error("Assignee with this email already exists");
    }

    const assigneeId = await ctx.db.insert("assignees", {
      userId,
      name: args.name,
      email: args.email,
    });

    return assigneeId;
  },
});

export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await getCurrentUser(ctx);

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("assignees")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("asc")
      .take(100);
  },
});

export const remove = mutation({
  args: {
    assigneeId: v.id("assignees"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new Error("User not found");
    }

    const assignee = await ctx.db.get(args.assigneeId);
    if (!assignee || assignee.userId !== user._id) {
      throw new Error("Assignee not found");
    }

    await ctx.db.delete(args.assigneeId);
  },
});
