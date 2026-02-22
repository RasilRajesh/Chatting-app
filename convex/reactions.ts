import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const ALLOWED_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"] as const;

export const listByMessage = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("reactions")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .collect();
    const byEmoji: Record<string, { count: number; userIds: string[] }> = {};
    for (const r of list) {
      if (!byEmoji[r.emoji]) {
        byEmoji[r.emoji] = { count: 0, userIds: [] };
      }
      byEmoji[r.emoji].count += 1;
      byEmoji[r.emoji].userIds.push(r.userId);
    }
    return byEmoji;
  },
});

export const toggle = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    if (!ALLOWED_EMOJIS.includes(args.emoji as (typeof ALLOWED_EMOJIS)[number])) {
      throw new Error("Invalid emoji");
    }
    const existing = await ctx.db
      .query("reactions")
      .withIndex("by_messageId_userId_emoji", (q) =>
        q
          .eq("messageId", args.messageId)
          .eq("userId", args.userId)
          .eq("emoji", args.emoji)
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    } else {
      await ctx.db.insert("reactions", {
        messageId: args.messageId,
        userId: args.userId,
        emoji: args.emoji,
      });
    }
  },
});

export const getReactionsForMessages = query({
  args: { messageIds: v.array(v.id("messages")) },
  handler: async (ctx, args) => {
    const result: Record<string, Record<string, { count: number }>> = {};
    for (const mid of args.messageIds) {
      const list = await ctx.db
        .query("reactions")
        .withIndex("by_messageId", (q) => q.eq("messageId", mid))
        .collect();
      const byEmoji: Record<string, { count: number }> = {};
      for (const r of list) {
        byEmoji[r.emoji] = { count: (byEmoji[r.emoji]?.count ?? 0) + 1 };
      }
      result[mid] = byEmoji;
    }
    return result;
  },
});
