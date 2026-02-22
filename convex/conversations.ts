import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const listForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const convos = await ctx.db.query("conversations").collect();
    const filtered = convos.filter((c) =>
      c.participants.some((p: Id<"users">) => p === args.userId)
    );
    filtered.sort((a, b) => (b.lastMessageTime ?? 0) - (a.lastMessageTime ?? 0));
    return filtered;
  },
});

export const getById = query({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getOrCreateOneOnOne = mutation({
  args: {
    userId: v.id("users"),
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const all = await ctx.db.query("conversations").collect();
    const existing = all.find(
      (c) =>
        !c.isGroup &&
        c.participants.length === 2 &&
        c.participants.includes(args.userId) &&
        c.participants.includes(args.otherUserId)
    );
    if (existing) return existing._id;
    const id = await ctx.db.insert("conversations", {
      participants: [args.userId, args.otherUserId],
      isGroup: false,
    });
    return id;
  },
});

export const createGroup = mutation({
  args: {
    creatorId: v.id("users"),
    name: v.string(),
    participantIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const participants = [args.creatorId, ...args.participantIds];
    const id = await ctx.db.insert("conversations", {
      participants,
      isGroup: true,
      groupName: args.name,
    });
    return id;
  },
});

export const updateLastMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    lastMessage: v.string(),
    lastMessageTime: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      lastMessage: args.lastMessage,
      lastMessageTime: args.lastMessageTime,
    });
  },
});
