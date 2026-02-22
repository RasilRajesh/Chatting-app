"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserSearch } from "@/components/UserSearch";
import { cn } from "@/lib/utils";

export function GroupCreateModal({
  open,
  onOpenChange,
  currentUserId,
  allUsers,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: Id<"users">;
  allUsers: Doc<"users">[];
  onCreated?: (conversationId: Id<"conversations">) => void;
}) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Doc<"users">[]>([]);
  const createGroup = useMutation(api.conversations.createGroup);
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleUser = (user: Doc<"users">) => {
    setSelected((prev) =>
      prev.some((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user]
    );
  };

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Group name is required");
      return;
    }
    if (selected.length === 0) {
      setError("Select at least one member");
      return;
    }
    setError(null);
    setSending(true);
    try {
      const id = await createGroup({
        creatorId: currentUserId,
        name: trimmed,
        participantIds: selected.map((u) => u._id),
      });
      onCreated?.(id);
      onOpenChange(false);
      setName("");
      setSelected([]);
      router.push(`/chat/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create group");
    } finally {
      setSending(false);
    }
  };

  const otherUsers = allUsers.filter((u) => u._id !== currentUserId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Group name</label>
            <Input
              placeholder="e.g. Weekend plans"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Members</label>
            <UserSearch
              users={otherUsers}
              onSelect={toggleUser}
              selectedIds={selected.map((u) => u._id)}
              className="border rounded-lg p-2"
            />
            {selected.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {selected.length} selected
              </p>
            )}
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={sending}>
              {sending ? "Creating…" : "Create group"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
