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
      ? "Someone is typing"
      : names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
      ? `${names[0]} and ${names[1]} are typing`
      : `${names.slice(0, 2).join(", ")} and others are typing`;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 self-start px-4 py-1 text-xs text-muted-foreground",
        className
      )}
    >
      <div className="flex h-5 w-5 items-center justify-center gap-0.5">
        <span className="h-1 w-1 animate-bounce-dot rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
        <span className="h-1 w-1 animate-bounce-dot rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
        <span className="h-1 w-1 animate-bounce-dot rounded-full bg-muted-foreground" />
      </div>
      <span className="truncate">{text}...</span>
    </div>
  );
}
