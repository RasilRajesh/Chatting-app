"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import type { Id } from "@/convex/_generated/dataModel";
import { formatMessageTime } from "@/lib/utils";
import { Reactions } from "@/components/Reactions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = Doc<"messages">;

export function MessageBubble({
  message,
  sender,
  isOwn,
  currentUserId,
  showSenderName,
}: {
  message: Message;
  sender: Doc<"users"> | null;
  isOwn: boolean;
  currentUserId: Id<"users">;
  showSenderName?: boolean;
}) {
  const softDelete = useMutation(api.messages.softDelete);
  const canDelete = isOwn && !message.deleted;

  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 max-w-[85%]",
        isOwn ? "self-end items-end" : "self-start items-start"
      )}
    >
      {showSenderName && sender && !isOwn && (
        <span className="text-xs font-medium text-muted-foreground px-1">
          {sender.name}
        </span>
      )}
      <div
        className={cn(
          "group relative rounded-2xl px-4 py-2",
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted rounded-bl-md"
        )}
      >
        <div className="flex items-end gap-2">
          <p
            className={cn(
              "text-sm break-words",
              message.deleted && "italic text-muted-foreground"
            )}
          >
            {message.deleted ? "This message was deleted" : message.content}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            <span
              className={cn(
                "text-[10px] opacity-80",
                isOwn ? "text-primary-foreground/80" : "text-muted-foreground"
              )}
            >
              {formatMessageTime(message.createdAt)}
            </span>
            {canDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isOwn ? "end" : "start"}>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() =>
                      softDelete({ messageId: message._id, senderId: currentUserId })
                    }
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        {!message.deleted && (
          <Reactions
            messageId={message._id}
            userId={currentUserId}
            className={isOwn ? "justify-end" : "justify-start"}
          />
        )}
      </div>
    </div>
  );
}
