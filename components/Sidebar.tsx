"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserSearch } from "@/components/UserSearch";
import { GroupCreateModal } from "@/components/GroupCreateModal";
import { UserButton } from "@clerk/nextjs";
import { Users, Search, MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils";

type User = Doc<"users">;

export function Sidebar({ currentUser }: { currentUser: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const [groupModalOpen, setGroupModalOpen] = useState(false);

  const conversations = useQuery(api.conversations.listForUser, {
    userId: currentUser._id,
  });
  const allUsers = useQuery(api.users.listExcept, {
    exceptUserId: currentUser._id,
  });
  const getOrCreateOneOnOne = useMutation(api.conversations.getOrCreateOneOnOne);

  const conversationIds = conversations?.map((c) => c._id) ?? [];
  const unreadCountsResult = useQuery(
    api.conversationReads.getUnreadCountsForConversations,
    conversationIds.length > 0
      ? { conversationIds, userId: currentUser._id }
      : "skip"
  );
  const unreadCounts = unreadCountsResult ?? {};

  const handleSelectUser = async (user: User) => {
    try {
      const id = await getOrCreateOneOnOne({
        userId: currentUser._id,
        otherUserId: user._id,
      });
      router.push(`/chat/${id}`);
    } catch {
      // ignore
    }
  };

  return (
    <>
      <aside
        className={cn(
          "flex flex-col w-full sm:w-80 border-r shrink-0",
          "max-sm:absolute max-sm:inset-y-0 max-sm:left-0 max-sm:z-10 max-sm:bg-background/95 max-sm:backdrop-blur-sm",
          pathname?.startsWith("/chat/") && pathname !== "/chat/new"
            ? "max-sm:hidden"
            : ""
        )}
      >
        <div className="p-4 border-b flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  avatarBox: "h-10 w-10",
                },
              }}
            />
            <span className="font-bold text-lg truncate">
              {currentUser.name}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => router.push("/chat/new")}
              title="New chat"
            >
              <MessageSquarePlus className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setGroupModalOpen(true)}
              title="New group"
            >
              <Users className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto">
          {conversations === undefined ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-lg bg-muted/50 animate-pulse"
                />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No conversations yet.
              <br />
              Start a new chat or create a group.
            </div>
          ) : (
            <ul className="p-2 space-y-1">
              {conversations.map((c) => (
                <ConversationItem
                  key={c._id}
                  conversation={c}
                  currentUser={currentUser}
                  unreadCount={unreadCounts[c._id] ?? 0}
                  isActive={pathname === `/chat/${c._id}`}
                />
              ))}
            </ul>
          )}
        </nav>
      </aside>

      <GroupCreateModal
        open={groupModalOpen}
        onOpenChange={setGroupModalOpen}
        currentUserId={currentUser._id}
        allUsers={allUsers ?? []}
      />
    </>
  );
}

function ConversationItem({
  conversation,
  currentUser,
  unreadCount,
  isActive,
}: {
  conversation: Doc<"conversations">;
  currentUser: User;
  unreadCount: number;
  isActive: boolean;
}) {
  const otherIds = conversation.participants.filter(
    (p) => p !== currentUser._id
  );
  const participants = useQuery(
    api.users.getByIds,
    otherIds.length > 0 ? { ids: otherIds } : "skip"
  );
  const title = conversation.isGroup
    ? conversation.groupName ?? "Group"
    : participants?.[0]?.name ?? "Unknown";
  const lastMessage = useQuery(
    api.messages.getLastMessage,
    conversation.lastMessage && typeof conversation.lastMessage === "string" && conversation.lastMessage.length > 10
      ? { messageId: conversation.lastMessage }
      : "skip"
  );

  const lastMessageContent =
    lastMessage === null // Message was deleted
      ? "Message deleted"
      : lastMessage
      ? `${lastMessage.senderId === currentUser._id ? "You: " : ""}${
          lastMessage.content.length > 30
            ? lastMessage.content.substring(0, 30) + "..."
            : lastMessage.content
        }`
      : "No messages yet";

  return (
    <Link
      href={`/chat/${conversation._id}`}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-colors",
        isActive ? "bg-muted" : "hover:bg-muted/50"
      )}
    >
      <Avatar className="h-12 w-12">
        {conversation.isGroup ? (
          <div className="h-11 w-11 rounded-full bg-primary/20 flex items-center justify-center">
            <Users
              className={cn(
                "h-5 w-5",
                isActive ? "text-primary-foreground" : "text-primary"
              )}
            />
          </div>
        ) : (
          <>
            <AvatarImage src={participants?.[0]?.image} />
            <AvatarFallback>
              {participants?.[0]?.name?.slice(0, 2).toUpperCase() ?? "?"}
            </AvatarFallback>
          </>
        )}
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <p
            className={cn(
              "font-semibold truncate",
              unreadCount > 0 && !isActive && "font-bold"
            )}
          >
            {title}
          </p>
          {unreadCount > 0 && (
            <span
              className={cn(
                "text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shrink-0",
                isActive
                  ? "bg-primary-foreground text-primary"
                  : "bg-primary text-primary-foreground"
              )}
            >
              {unreadCount}
            </span>
          )}
        </div>
        <p
          className={cn(
            "text-sm truncate",
            isActive ? "text-primary-foreground/80" : "text-muted-foreground",
            unreadCount > 0 &&
              !isActive &&
              "font-semibold text-foreground/80"
          )}
        >
          {lastMessageContent}
        </p>
      </div>
    </Link>
  );
}
