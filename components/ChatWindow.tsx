"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageBubble } from "@/components/MessageBubble";
import { TypingIndicator } from "@/components/TypingIndicator";
import { UserSearch } from "@/components/UserSearch";
import { Send, ArrowLeft, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type Conversation = Doc<"conversations">;
type User = Doc<"users">;

export function ChatWindow({
  conversationId,
  conversation,
  otherParticipants,
  currentUserId,
}: {
  conversationId: Id<"conversations"> | null;
  conversation: Conversation | null;
  otherParticipants: User[];
  currentUserId: Id<"users">;
}) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [atBottom, setAtBottom] = useState(true);
  const [showNewButton, setShowNewButton] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const prevMessageCountRef = useRef(0);

  const messages = useQuery(
    api.messages.listByConversation,
    conversationId ? { conversationId } : "skip"
  );
  const sendMessage = useMutation(api.messages.send);
  const setTyping = useMutation(api.typing.setTyping);
  const markRead = useMutation(api.conversationReads.markRead);
  const participantDocs = useQuery(
    api.users.getByIds,
    conversation?.participants?.length
      ? { ids: conversation.participants as Id<"users">[] }
      : "skip"
  );
  const userMap = React.useMemo(() => {
    const m: Record<string, User> = {};
    for (const u of participantDocs ?? []) {
      m[u._id] = u;
    }
    return m;
  }, [participantDocs]);

  const isNewChat = !conversationId && !conversation;
  const allUsersForNewChat = useQuery(
    api.users.listExcept,
    isNewChat ? { exceptUserId: currentUserId } : "skip"
  );
  const getOrCreate = useMutation(api.conversations.getOrCreateOneOnOne);

  useEffect(() => {
    if (!conversationId) return;
    markRead({ conversationId, userId: currentUserId });
  }, [conversationId, currentUserId, markRead]);

  const scrollToBottom = useCallback((behavior: "smooth" | "auto" = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setAtBottom(true);
    setShowNewButton(false);
  }, []);

  useEffect(() => {
    if (!messages || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const isOwnMessage = lastMessage.senderId === currentUserId;
    const isNewer = messages.length > prevMessageCountRef.current;

    if (isOwnMessage) {
      // Always scroll to bottom if we sent the message
      scrollToBottom("auto");
    } else if (atBottom) {
      // Scroll if we're already at the bottom
      scrollToBottom();
    } else if (isNewer) {
      // Show button if new messages arrive and we're scrolled up
      setShowNewButton(true);
    }

    prevMessageCountRef.current = messages.length;
  }, [messages, atBottom, currentUserId, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    // A little extra space to ensure it's "at the bottom"
    const threshold = 120; 
    const atBottomNow =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setAtBottom(atBottomNow);
    if (atBottomNow) {
      setShowNewButton(false);
    }
  }, []);

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || !conversationId) return;
    setInputValue("");
    setSendError(null);
    setSending(true);
    try {
      await sendMessage({
        conversationId,
        senderId: currentUserId,
        content: trimmed,
      });
      // We now rely on the useEffect to scroll, so this can be removed.
      // scrollToBottom("auto"); 
    } catch (e) {
      setInputValue(trimmed);
      setSendError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!conversationId) return;
    if (inputValue.trim()) {
      if (typingTimeoutRef.current === null) {
        setTyping({ conversationId, userId: currentUserId });
      } else {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        typingTimeoutRef.current = null;
      }, 1800); // Keep user typing for 1.8s after last keypress
    }
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [inputValue, conversationId, currentUserId, setTyping]);

  if (isNewChat) {
    return (
      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-2 border-b px-4 py-3 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => router.push("/chat/new")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold">New chat</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          {allUsersForNewChat === undefined ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-14 rounded-lg bg-muted/50 animate-pulse"
                />
              ))}
            </div>
          ) : allUsersForNewChat.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm">
              No other users yet.
            </p>
          ) : (
            <UserSearch
              users={allUsersForNewChat}
              onSelect={async (user) => {
                const id = await getOrCreate({
                  userId: currentUserId,
                  otherUserId: user._id,
                });
                router.push(`/chat/${id}`);
              }}
            />
          )}
        </div>
      </div>
    );
  }

  if (!conversationId || !conversation) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Select a conversation
      </div>
    );
  }

  const title = conversation.isGroup
    ? conversation.groupName
    : otherParticipants[0]?.name ?? "Chat";
  const isOtherOnline = !conversation.isGroup && otherParticipants[0]?.isOnline;
  const subtitle = conversation.isGroup
    ? `${otherParticipants.length} members`
    : isOtherOnline ? "Online" : "Offline";

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <header className="flex items-center gap-3 border-b px-4 py-3 shrink-0 bg-background/70 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={() => router.push("/chat/new")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        {conversation.isGroup ? (
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
        ) : (
          <div className="relative shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherParticipants[0]?.image} />
              <AvatarFallback>
                {otherParticipants[0]?.name?.slice(0, 2).toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            {otherParticipants[0]?.isOnline && (
              <span
                className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background"
                aria-hidden
              />
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold truncate text-lg">{title}</h1>
          {subtitle && (
            <p className={cn(
              "text-xs font-medium truncate flex items-center gap-1",
              isOtherOnline ? "text-green-500" : "text-muted-foreground"
            )}>
              <span className={cn(
                "inline-block h-2 w-2 rounded-full",
                isOtherOnline ? "bg-green-500" : "bg-gray-400"
              )} />
              {subtitle}
            </p>
          )}
        </div>
      </header>

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto flex flex-col p-4 gap-4 min-h-0 relative"
      >
        {messages === undefined ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-12 rounded-2xl",
                  i % 2 === 0
                    ? "self-end w-2/3 bg-primary/10"
                    : "self-start w-2/3 bg-muted/50"
                )}
              />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
            No messages yet. Say hello!
          </div>
        ) : (
          <>
            {messages.map((msg: Doc<"messages">) => (
              <MessageBubble
                key={msg._id}
                message={msg}
                sender={userMap[msg.senderId] ?? null}
                isOwn={msg.senderId === currentUserId}
                currentUserId={currentUserId}
                showSenderName={conversation.isGroup}
              />
            ))}
            <TypingIndicator
              conversationId={conversationId}
              excludeUserId={currentUserId}
              users={participantDocs ?? []}
            />
          </>
        )}
        <div ref={messagesEndRef} />
        {showNewButton && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => scrollToBottom("smooth")}
              className="shadow-lg rounded-full animate-bounce"
            >
              ↓ New messages
            </Button>
          </div>
        )}
      </div>

      {sendError && (
        <div className="px-4 py-2 flex items-center justify-between gap-2 bg-destructive/10 text-destructive text-sm">
          <span>{sendError}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSend}>
              Retry
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSendError(null)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      <div className="border-t p-4 flex gap-3 shrink-0 bg-background/70 backdrop-blur-sm">
        <Input
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 h-11 rounded-full px-5"
          disabled={sending}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!inputValue.trim() || sending}
          className="shrink-0 h-11 w-11 rounded-full"
        >
          {sending ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
