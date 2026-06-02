import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    authId: v.optional(v.string()),
    workosId: v.optional(v.string()),
    email: v.string(),
    name: v.string(),
  })
    .index("by_authId", ["authId"])
    .index("by_workosId", ["workosId"])
    .index("by_email", ["email"]),

  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    creatorId: v.id("users"),
    assigneeEmail: v.string(),
    assigneeName: v.optional(v.string()),
    reminderAt: v.number(),
    status: v.union(v.literal("pending"), v.literal("completed")),
    emailToken: v.string(),
    createdAt: v.number(),
  })
    .index("by_creator", ["creatorId"])
    .index("by_emailToken", ["emailToken"])
    .index("by_creator_and_status", ["creatorId", "status"])
    .index("by_status_and_reminder", ["status", "reminderAt"]),

  assignees: defineTable({
    userId: v.id("users"),
    name: v.string(),
    email: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_email", ["userId", "email"]),
});
