"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
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
import { UserSearch } from "@/components/UserSearch";

export function NewChatModal({
    open,
    onOpenChange,
    currentUserId,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentUserId: Id<"users">;
}) {
    const router = useRouter();
    const getOrCreateOneOnOne = useMutation(api.conversations.getOrCreateOneOnOne);
    const [loading, setLoading] = useState(false);

    const handleSelectUser = async (user: Doc<"users">) => {
        setLoading(true);
        try {
            const id = await getOrCreateOneOnOne({
                userId: currentUserId,
                otherUserId: user._id,
            });
            onOpenChange(false);
            router.push(`/chat/${id}`);
        } catch (error) {
            console.error("Failed to start chat:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>New Chat</DialogTitle>
                </DialogHeader>
                {open && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Select a user to start a direct message.
                        </p>
                        <UserSearch
                            onSelect={handleSelectUser}
                            currentUserId={currentUserId}
                            className="border rounded-lg p-2"
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
