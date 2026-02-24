import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    image: v.string(),
    isOnline: v.boolean(),
    createdAt: v.number(),
    themeSettings: v.optional(
      v.object({
        accentColor: v.string(),
        bubbleStyle: v.string(),
        fontFamily: v.optional(v.string()),
        chatBackground: v.optional(v.string()),
        mode: v.string(),
      })
    ),
  }).index("by_clerkId", ["clerkId"]),

  conversations: defineTable({
    participants: v.array(v.id("users")),
    isGroup: v.boolean(),
    groupName: v.optional(v.string()),
    groupImage: v.optional(v.string()),
    lastMessage: v.optional(v.string()),
    lastMessageTime: v.optional(v.number()),
  })
    .index("by_lastMessageTime", ["lastMessageTime"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
    deleted: v.boolean(),
  }).index("by_conversationId", ["conversationId"]),

  conversationReads: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    lastSeenAt: v.number(),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_userId", ["userId"])
    .index("by_conversationId_userId", ["conversationId", "userId"]),

  typingStatus: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    lastTypedAt: v.number(),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_conversationId_userId", ["conversationId", "userId"]),

  reactions: defineTable({
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
  })
    .index("by_messageId", ["messageId"])
    .index("by_messageId_userId_emoji", ["messageId", "userId", "emoji"]),
});
