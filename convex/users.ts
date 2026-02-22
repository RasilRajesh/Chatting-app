import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createOrUpdate = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    image: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: no auth identity. Ensure Clerk JWT template is configured.");
    }
    // Use the authenticated identity's subject as the canonical clerkId
    const clerkId = identity.subject;
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
        image: args.image,
        isOnline: true,
      });
      return existing._id;
    }
    return await ctx.db.insert("users", {
      clerkId,
      name: args.name,
      email: args.email,
      image: args.image,
      isOnline: true,
      createdAt: now,
    });
  },
});

export const setOnline = mutation({
  args: { clerkId: v.string(), isOnline: v.boolean() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!user) return;
    await ctx.db.patch(user._id, { isOnline: args.isOnline });
  },
});

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

export const listExcept = query({
  args: { exceptUserId: v.id("users") },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("users").collect();
    return all.filter((u) => u._id !== args.exceptUserId);
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByIds = query({
  args: { ids: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const result = [];
    for (const id of args.ids) {
      const u = await ctx.db.get(id);
      if (u) result.push(u);
    }
    return result;
  },
});
