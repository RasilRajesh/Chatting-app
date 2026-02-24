"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Id, Doc } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserSearch } from "@/components/UserSearch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function GroupCreateModal({
  open,
  onOpenChange,
  currentUserId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: Id<"users">;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New group</DialogTitle>
        </DialogHeader>
        {open && (
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

              {selected.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 max-h-24 overflow-y-auto p-1">
                  {selected.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center gap-1 bg-primary/10 text-primary rounded-full pl-1 pr-2 py-0.5 text-xs font-medium border border-primary/20"
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={user.image} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="truncate max-w-[80px]">{user.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleUser(user)}
                        className="hover:text-primary/70 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <UserSearch
                onSelect={toggleUser}
                selectedIds={selected.map((u) => u._id)}
                currentUserId={currentUserId}
                multiSelect
                className="border rounded-lg p-2"
              />
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
        )}
      </DialogContent>
    </Dialog>
  );
}

