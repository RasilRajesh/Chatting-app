"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Doc } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

export function TypingIndicator({
  conversationId,
  excludeUserId,
  users,
  className,
}: {
  conversationId: Id<"conversations">;
  excludeUserId: Id<"users">;
  users: Doc<"users">[];
  className?: string;
}) {
  const typing = useQuery(api.typing.listActive, {
    conversationId,
    excludeUserId,
  });

  if (!typing || typing.length === 0) return null;

  const names = typing
    .map((t) => users.find((u) => u._id === t.userId)?.name)
    .filter(Boolean) as string[];
  const text =
    names.length === 0
      ? "Someone is typing..."
      : names.length === 1
        ? `${names[0]} is typing...`
        : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} are typing...`;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-1 text-sm text-muted-foreground",
        className
      )}
    >
      <span className="flex gap-1">
        <span className="animate-bounce [animation-delay:0ms]">.</span>
        <span className="animate-bounce [animation-delay:150ms]">.</span>
        <span className="animate-bounce [animation-delay:300ms]">.</span>
      </span>
      <span>{text}</span>
    </div>
  );
}
