"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Doc } from "@/convex/_generated/dataModel";
import type { Id } from "@/convex/_generated/dataModel";

type ChatContextValue = {
  currentUser: Doc<"users">;
  currentUserId: Id<"users">;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({
  currentUser,
  children,
}: {
  currentUser: Doc<"users">;
  children: ReactNode;
}) {
  return (
    <ChatContext.Provider
      value={{ currentUser, currentUserId: currentUser._id }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
  return ctx;
}
