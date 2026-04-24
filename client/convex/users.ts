import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

// Internal query to get a user by ID
export const get = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});
