import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const markRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const now = Date.now();
    const existing = await ctx.db
      .query("conversationReads")
      .withIndex("by_conversationId_userId", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", args.userId)
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { lastSeenAt: now });
    } else {
      await ctx.db.insert("conversationReads", {
        conversationId: args.conversationId,
        userId: args.userId,
        lastSeenAt: now,
      });
    }
  },
});

export const getLastSeen = query({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const read = await ctx.db
      .query("conversationReads")
      .withIndex("by_conversationId_userId", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", args.userId)
      )
      .unique();
    return read?.lastSeenAt ?? 0;
  },
});

export const getUnreadCount = query({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const read = await ctx.db
      .query("conversationReads")
      .withIndex("by_conversationId_userId", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", args.userId)
      )
      .unique();
    const lastSeenAt = read?.lastSeenAt ?? 0;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();
    return messages.filter(
      (m) => m.createdAt > lastSeenAt && m.senderId !== args.userId
    ).length;
  },
});

export const getAllReadsForConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const reads = await ctx.db
      .query("conversationReads")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();
    return reads.map((r) => ({ userId: r.userId as string, lastSeenAt: r.lastSeenAt }));
  },
});

export const getUnreadCountsForConversations = query({
  args: {
    conversationIds: v.array(v.id("conversations")),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const result: Record<string, number> = {};
    for (const conversationId of args.conversationIds) {
      const read = await ctx.db
        .query("conversationReads")
        .withIndex("by_conversationId_userId", (q) =>
          q.eq("conversationId", conversationId).eq("userId", args.userId)
        )
        .unique();
      const lastSeenAt = read?.lastSeenAt ?? 0;
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversationId", (q) =>
          q.eq("conversationId", conversationId)
        )
        .collect();
      result[conversationId] = messages.filter(
        (m) => m.createdAt > lastSeenAt && m.senderId !== args.userId
      ).length;
    }
    return result;
  },
});
