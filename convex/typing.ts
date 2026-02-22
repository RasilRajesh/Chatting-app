import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const TYPING_TIMEOUT_MS = 2000;

export const setTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const now = Date.now();
    const existing = await ctx.db
      .query("typingStatus")
      .withIndex("by_conversationId_userId", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", args.userId)
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { lastTypedAt: now });
    } else {
      await ctx.db.insert("typingStatus", {
        conversationId: args.conversationId,
        userId: args.userId,
        lastTypedAt: now,
      });
    }
  },
});

export const listActive = query({
  args: {
    conversationId: v.id("conversations"),
    excludeUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("typingStatus")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();
    const cutoff = Date.now() - TYPING_TIMEOUT_MS;
    const active = all.filter(
      (t) => t.userId !== args.excludeUserId && t.lastTypedAt > cutoff
    );
    return active;
  },
});
