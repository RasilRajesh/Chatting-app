"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢"] as const;

export function Reactions({
  messageId,
  userId,
}: {
  messageId: Id<"messages">;
  userId: Id<"users">;
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
    <div className="relative flex items-center flex-wrap gap-1 mt-1.5">
      {reactionsByEmoji.map(({ emoji, count, userIds }) => (
        <button
          key={emoji}
          onClick={() => handleReact(emoji)}
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition-colors",
            userIds.includes(userId)
              ? "bg-blue-100 border-blue-300 text-blue-700"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
          )}
        >
          <span>{emoji}</span>
          <span className="font-semibold">{count}</span>
        </button>
      ))}

      <button
        onClick={() => setPickerOpen((v) => !v)}
        className="flex items-center justify-center h-6 w-6 rounded-full bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
        title="Add reaction"
      >
        <SmilePlus className="h-3.5 w-3.5 text-gray-500" />
      </button>

      {pickerOpen && (
        <div className="absolute bottom-full mb-1 left-0 z-50 flex items-center gap-1 bg-white border border-gray-200 rounded-full shadow-lg px-2 py-1">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              className="text-xl hover:scale-125 transition-transform p-0.5"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
