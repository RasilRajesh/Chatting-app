"use client";

import { ChatWindow } from "@/components/ChatWindow";
import { useChatContext } from "@/components/providers/ChatContext";

export default function NewChatPage() {
  const { currentUserId } = useChatContext();
  return (
    <ChatWindow
      conversationId={null}
      conversation={null}
      otherParticipants={[]}
      currentUserId={currentUserId}
    />
  );
}
