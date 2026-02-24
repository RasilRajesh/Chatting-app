"use client";

import { useState, memo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserSearch } from "@/components/UserSearch";
import { GroupCreateModal } from "@/components/GroupCreateModal";
import { NewChatModal } from "@/components/NewChatModal";
import { ThemeSettingsModal } from "@/components/ThemeSettingsModal";
import { UserButton } from "@clerk/nextjs";
import { Users, Search, MessageSquarePlus, Pencil, Check, X, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

type User = Doc<"users">;

export function Sidebar({ currentUser }: { currentUser: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const updateName = useMutation(api.users.updateName);

  const startEditingName = () => {
    setEditNameValue(currentUser.name);
    setIsEditingName(true);
  };

  const cancelEditingName = () => {
    setIsEditingName(false);
    setEditNameValue("");
  };

  const saveEditingName = async () => {
    const trimmed = editNameValue.trim();
    if (!trimmed || trimmed === currentUser.name) {
      cancelEditingName();
      return;
    }
    setNameSaving(true);
    try {
      // Update Convex immediately for instant UI feedback
      await updateName({ name: trimmed });
      // Also update Clerk so the name persists on page reload
      // Clerk stores firstName/lastName; we write the whole string as firstName
      await clerkUser?.update({ firstName: trimmed, lastName: "" }).catch(() => { });
      setIsEditingName(false);
    } catch {
      // ignore
    } finally {
      setNameSaving(false);
    }
  };

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
          "flex flex-col w-full sm:w-80 border-r shrink-0 transition-colors duration-300",
          "max-sm:absolute max-sm:inset-y-0 max-sm:left-0 max-sm:z-10 max-sm:bg-background/95 max-sm:backdrop-blur-sm",
          pathname?.startsWith("/chat/") && pathname !== "/chat"
            ? "max-sm:hidden"
            : ""
        )}
        style={{ backgroundColor: "var(--chat-bubble-tint)" }}
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
            {isEditingName ? (
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <input
                  autoFocus
                  className="font-bold text-base border rounded px-1 py-0.5 w-full bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEditingName();
                    if (e.key === "Escape") cancelEditingName();
                  }}
                  disabled={nameSaving}
                  maxLength={50}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-green-600 hover:text-green-700"
                  onClick={saveEditingName}
                  disabled={nameSaving}
                  title="Save name"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-destructive hover:text-destructive/80"
                  onClick={cancelEditingName}
                  disabled={nameSaving}
                  title="Cancel"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1 min-w-0 group">
                <span className="font-bold text-lg truncate">
                  {currentUser.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={startEditingName}
                  title="Edit display name"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setNewChatModalOpen(true)}
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
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setThemeModalOpen(true)}
              title="Theme settings"
            >
              <Palette className="h-5 w-5" />
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

      <NewChatModal
        open={newChatModalOpen}
        onOpenChange={setNewChatModalOpen}
        currentUserId={currentUser._id}
      />

      <GroupCreateModal
        open={groupModalOpen}
        onOpenChange={setGroupModalOpen}
        currentUserId={currentUser._id}
      />

      <ThemeSettingsModal
        open={themeModalOpen}
        onOpenChange={setThemeModalOpen}
        currentUser={currentUser}
      />
    </>
  );
}

const ConversationItem = memo(function ConversationItem({
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
        ? `${lastMessage.senderId === currentUser._id ? "You: " : ""}${lastMessage.content.length > 30
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
});
