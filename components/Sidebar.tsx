"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserSearch } from "@/components/UserSearch";
import { GroupCreateModal } from "@/components/GroupCreateModal";
import { UserButton } from "@clerk/nextjs";
import { Users, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type User = Doc<"users">;

export function Sidebar({ currentUser }: { currentUser: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);

  const conversations = useQuery(api.conversations.listForUser, {
    userId: currentUser._id,
  });
  const allUsers = useQuery(api.users.listExcept, {
    exceptUserId: currentUser._id,
  });
  const getOrCreateOneOnOne = useMutation(api.conversations.getOrCreateOneOnOne);

  const conversationIds = conversations?.map((c: Doc<"conversations">) => c._id) ?? [];
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
      setSearchOpen(false);
      router.push(`/chat/${id}`);
    } catch {
      // ignore
    }
  };

  const filteredUsers = allUsers ?? [];

  return (
    <>
      <aside
        className={cn(
          "flex flex-col w-full sm:w-80 border-r bg-card shrink-0",
          "max-sm:absolute max-sm:inset-y-0 max-sm:left-0 max-sm:z-10 max-sm:bg-background",
          pathname?.startsWith("/chat/") && pathname !== "/chat/new"
            ? "max-sm:hidden"
            : ""
        )}
      >
        <div className="p-3 border-b flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                },
              }}
            />
            <span className="font-semibold truncate">{currentUser.name}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setSearchOpen((o) => !o)}
              title="New chat"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setGroupModalOpen(true)}
              title="New group"
            >
              <Users className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {searchOpen && allUsers && (
          <div className="p-2 border-b">
            <UserSearch
              users={filteredUsers}
              onSelect={handleSelectUser}
              className="max-h-64"
            />
          </div>
        )}

        <nav className="flex-1 overflow-y-auto">
          {conversations === undefined ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 rounded-lg bg-muted/50 animate-pulse"
                />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No conversations yet. Start a new chat or create a group.
            </div>
          ) : (
            <ul className="p-2 space-y-0.5">
              {conversations.map((c: Doc<"conversations">) => (
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
    (p: Id<"users">) => p !== currentUser._id
  );
  const participants = useQuery(
    api.users.getByIds,
    otherIds.length > 0 ? { ids: otherIds } : "skip"
  );
  const title = conversation.isGroup
    ? (conversation.groupName ?? "Group")
    : (participants?.[0]?.name ?? "Unknown");
  const subtitle = conversation.isGroup
    ? `${participants?.length ?? 0} members`
    : participants?.[0]?.isOnline
      ? "Online"
      : "Offline";

  return (
    <li>
      <Link
        href={`/chat/${conversation._id}`}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent",
          isActive && "bg-accent"
        )}
      >
        {conversation.isGroup ? (
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-primary" />
          </div>
        ) : (
          <div className="relative shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={participants?.[0]?.image} />
              <AvatarFallback>{title.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            {participants?.[0]?.isOnline && (
              <span
                className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background"
                aria-hidden
              />
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {conversation.lastMessage || subtitle}
          </p>
        </div>
        {unreadCount > 0 && (
          <span className="shrink-0 h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>
    </li>
  );
}
