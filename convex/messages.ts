import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export const listByConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();
  },
});

export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const trimmed = args.content.trim();
    if (!trimmed) throw new Error("Message cannot be empty");
    const now = Date.now();
    const msgId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      content: trimmed,
      createdAt: now,
      deleted: false,
    });
    await ctx.db.patch(args.conversationId, {
      lastMessage: msgId,
      lastMessageTime: now,
    });
    return msgId;
  },
});

export const getLastMessage = query({
  args: { messageId: v.string() },
  handler: async (ctx, args) => {
    try {
      return await ctx.db.get(args.messageId as Id<"messages">);
    } catch {
      return null;
    }
  },
});

export const softDelete = mutation({
  args: { messageId: v.id("messages"), senderId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const msg = await ctx.db.get(args.messageId);
    if (!msg || msg.senderId !== args.senderId) return;
    await ctx.db.patch(args.messageId, {
      content: "This message was deleted",
      deleted: true,
    });
  },
});
