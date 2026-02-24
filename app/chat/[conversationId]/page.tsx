"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useChatContext } from "@/components/providers/ChatContext";
import { ChatWindow } from "@/components/ChatWindow";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  const id = conversationId as Id<"conversations">;
  const { currentUserId } = useChatContext();

  const isInvalidId = !conversationId || conversationId === "new" || conversationId.length < 5;

  const conversation = useQuery(
    api.conversations.getById,
    !isInvalidId ? { id } : "skip"
  );

  useEffect(() => {
    if (isInvalidId) {
      router.replace("/chat");
    }
  }, [isInvalidId, router]);

  if (isInvalidId) {
    return null;
  }

  const otherParticipantIds =
    conversation?.participants.filter((p: Id<"users">) => p !== currentUserId) ?? [];
  const otherParticipantsQuery = useQuery(
    api.users.getByIds,
    otherParticipantIds.length > 0 ? { ids: otherParticipantIds } : "skip"
  );
  const otherParticipants = otherParticipantsQuery ?? [];

  if (!conversationId) {
    return (
      <div className="flex flex-1 flex-col">
        <Skeleton className="h-14 border-b" />
        <div className="flex-1 p-4">
          <Skeleton className="mx-auto h-64 max-w-md rounded-lg" />
        </div>
      </div>
    );
  }

  if (conversation === undefined) {
    return (
      <div className="flex flex-1 flex-col">
        <Skeleton className="h-14 border-b" />
        <div className="flex-1 p-4 space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-3/4 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (conversation === null) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Conversation not found.
      </div>
    );
  }

  return (
    <ChatWindow
      conversationId={id}
      conversation={conversation}
      otherParticipants={otherParticipants}
      currentUserId={currentUserId}
    />
  );
}
