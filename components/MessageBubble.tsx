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
        "flex flex-col gap-1 max-w-[85%]",
        isOwn ? "self-end items-end" : "self-start items-start"
      )}
    >
      {showSenderName && sender && !isOwn && (
        <span className="text-xs font-medium text-muted-foreground px-2">
          {sender.name}
        </span>
      )}
      <div
        className={cn(
          "group relative rounded-2xl px-3.5 py-2 shadow-sm",
          isOwn
            ? "bg-whatsapp-green-light rounded-br-lg"
            : "bg-muted rounded-bl-lg",
          message.deleted && "bg-transparent border border-dashed"
        )}
      >
        <div className="flex items-end gap-2">
          <div
            className={cn(
              "text-sm break-words",
              message.deleted && "italic text-xs"
            )}
          >
            {message.deleted ? "This message was deleted" : message.content}
          </div>
          {!message.deleted && (
            <span
              className={cn(
                "text-[11px] shrink-0 text-muted-foreground/70"
              )}
            >
              {formatMessageTime(message.createdAt)}
            </span>
          )}
        </div>
        {!message.deleted && (
          <Reactions messageId={message._id} userId={currentUserId} />
        )}
        {!message.deleted && (
          <div className="absolute -top-4 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {canDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() =>
                      softDelete({
                        messageId: message._id,
                        senderId: currentUserId,
                      })
                    }
                  >
                    Delete Message
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
