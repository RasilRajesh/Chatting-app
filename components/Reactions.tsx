"use client";

import { useState, memo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢"] as const;

export const Reactions = memo(function Reactions({
  messageId,
  userId,
  isOwn,
}: {
  messageId: Id<"messages">;
  userId: Id<"users">;
  isOwn?: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const reactions = useQuery(api.reactions.listByMessage, { messageId });
  const toggle = useMutation(api.reactions.toggle);

  const handleReact = (emoji: string) => {
    toggle({ messageId, userId, emoji });
    setPickerOpen(false);
  };

  const reactionsByEmoji = reactions ? reactions.filter((r) => r.count > 0) : [];

  return (
    <div className={cn(
      "relative flex items-center flex-wrap gap-1",
      isOwn ? "flex-row-reverse" : "flex-row"
    )}>
      {reactionsByEmoji.length > 0 && (
        <div className="flex items-center flex-wrap gap-1 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm rounded-full px-1.5 py-0.5">
          {reactionsByEmoji.map(({ emoji, count, userIds }) => (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              className={cn(
                "flex items-center gap-1 rounded-full px-1 py-0.5 text-xs transition-colors",
                userIds.includes(userId)
                  ? "text-blue-600 font-bold"
                  : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              <span>{emoji}</span>
              {count > 1 && <span className="text-[10px]">{count}</span>}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setPickerOpen((v) => !v)}
        className={cn(
          "flex items-center justify-center h-6 w-6 rounded-full bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
          pickerOpen && "border-primary"
        )}
        title="Add reaction"
      >
        <SmilePlus className="h-3.5 w-3.5 text-gray-400 group-hover:text-primary transition-colors" />
      </button>

      {pickerOpen && (
        <div className={cn(
          "absolute bottom-full mb-2 z-50 flex items-center gap-1 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border dark:border-gray-700 rounded-full shadow-lg px-2 py-1 animate-in fade-in zoom-in slide-in-from-bottom-2 duration-200",
          isOwn ? "right-0" : "left-0"
        )}>
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              className="text-xl hover:scale-125 hover:-translate-y-1 transition-all p-1 active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
