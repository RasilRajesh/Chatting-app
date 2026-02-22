"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢"] as const;

export function Reactions({
  messageId,
  userId,
  className,
}: {
  messageId: Id<"messages">;
  userId: Id<"users">;
  className?: string;
}) {
  const reactionsMap = useQuery(api.reactions.listByMessage, { messageId });
  const toggle = useMutation(api.reactions.toggle);

  if (!reactionsMap) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-0.5 mt-0.5",
        className
      )}
    >
      {EMOJIS.map((emoji) => {
        const data = reactionsMap[emoji];
        const count = data?.count ?? 0;
        const isActive = data?.userIds?.includes(userId) ?? false;
        return (
          <Button
            key={emoji}
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-1.5 text-sm",
              isActive && "bg-primary/10 ring-1 ring-primary/20"
            )}
            onClick={() => toggle({ messageId, userId, emoji })}
          >
            <span>{emoji}</span>
            {count > 0 && (
              <span className="ml-0.5 text-muted-foreground">{count}</span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
