"use client";

import React, { memo } from "react";
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
import { MoreHorizontal, Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = Doc<"messages">;

export const MessageBubble = memo(function MessageBubble({
  message,
  sender,
  isOwn,
  currentUserId,
  showSenderName,
  tickStatus = "sent",
}: {
  message: Message;
  sender: Doc<"users"> | null;
  isOwn: boolean;
  currentUserId: Id<"users">;
  showSenderName?: boolean;
  tickStatus?: "sent" | "delivered" | "read";
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
          "group relative px-3.5 py-2 shadow-sm message-bubble-content transition-all duration-300",
          isOwn
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
          message.deleted && "bg-transparent border border-dashed text-foreground/50 text-foreground/70"
        )}
        style={{
          backgroundColor: isOwn ? undefined : "rgba(var(--muted), 0.8)",
          boxShadow: !isOwn ? "inset 0 0 40px var(--chat-bubble-tint)" : undefined,
        }}
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
            <span className="flex items-center gap-0.5 shrink-0">
              <span className={cn(
                "text-[11px]",
                isOwn ? "text-primary-foreground/70" : "text-muted-foreground/70"
              )}>
                {formatMessageTime(message.createdAt)}
              </span>
              {isOwn && (
                <span className="ml-0.5">
                  {tickStatus === "read" ? (
                    <CheckCheck className="h-3.5 w-3.5 text-blue-400" />
                  ) : tickStatus === "delivered" ? (
                    <CheckCheck className={cn("h-3.5 w-3.5", isOwn ? "text-primary-foreground/60" : "text-muted-foreground/60")} />
                  ) : (
                    <Check className={cn("h-3.5 w-3.5", isOwn ? "text-primary-foreground/60" : "text-muted-foreground/60")} />
                  )}
                </span>
              )}
            </span>
          )}
        </div>

        {!message.deleted && (
          <div className="absolute -top-4 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {canDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm border shadow-sm"
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

      {!message.deleted && (
        <div className={cn(
          "relative -mt-3.5 px-1 z-20",
          isOwn ? "mr-2" : "ml-2"
        )}>
          <Reactions
            messageId={message._id}
            userId={currentUserId}
            isOwn={isOwn}
          />
        </div>
      )}
    </div>
  );
});
