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
      // Always sync from Clerk so profile name changes propagate everywhere.
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
    return await ctx.db
      .query("users")
      .order("desc")
      .take(100) // Limit to 100 users for initial list
      .then((users) => users.filter((u) => u._id !== args.exceptUserId));
  },
});

export const search = query({
  args: {
    query: v.string(),
    exceptUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const q = args.query.trim().toLowerCase();

    if (!q) {
      // Instant return for empty query
      return await ctx.db
        .query("users")
        .order("desc")
        .take(10)
        .then(users => users.filter(u => u._id !== args.exceptUserId));
    }

    // Still need to collect for fuzzy match, but we can limit the search
    const all = await ctx.db.query("users").collect();
    const results = [];
    for (const u of all) {
      if (u._id === args.exceptUserId) continue;
      if (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      ) {
        results.push(u);
        if (results.length >= 20) break; // Limit search results
      }
    }
    return results;
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const updateName = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const trimmed = args.name.trim();
    if (!trimmed) throw new Error("Name cannot be empty");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, { name: trimmed });
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

export const updateTheme = mutation({
  args: {
    accentColor: v.string(),
    bubbleStyle: v.string(),
    fontFamily: v.optional(v.string()),
    chatBackground: v.optional(v.string()),
    mode: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, {
      themeSettings: {
        accentColor: args.accentColor,
        bubbleStyle: args.bubbleStyle,
        fontFamily: args.fontFamily,
        chatBackground: args.chatBackground,
        mode: args.mode,
      },
    });
  },
});
