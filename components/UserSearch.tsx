"use client";

import { useState, useEffect, memo } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type User = Doc<"users">;

const UserItem = memo(({ user, onSelect, isSelected }: { user: User; onSelect: (u: User) => void; isSelected: boolean }) => (
    <li>
        <button
            type="button"
            onClick={() => onSelect(user)}
            className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-accent transition-colors",
                isSelected && "bg-accent"
            )}
        >
            <div className="relative">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback>
                        {user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <span className={cn(
                    "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background",
                    user.isOnline ? "bg-green-500" : "bg-gray-400"
                )} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                </p>
            </div>
            {isSelected && (
                <span className="text-primary text-sm">✓</span>
            )}
        </button>
    </li>
));

UserItem.displayName = "UserItem";

export const UserSearch = memo(function UserSearch({
    onSelect,
    selectedIds,
    currentUserId,
    className,
    multiSelect = false,
}: {
    onSelect: (user: User) => void;
    selectedIds?: Id<"users">[];
    currentUserId: Id<"users">;
    className?: string;
    multiSelect?: boolean;
}) {
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const selectedSet = new Set(selectedIds ?? []);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);
        return () => clearTimeout(handler);
    }, [query]);

    const searchResults = useQuery(
        api.users.search,
        { query: debouncedQuery, exceptUserId: currentUserId }
    );

    const isLoading = searchResults === undefined;

    return (
        <div className={cn("flex flex-col", className)}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search by name or email..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9"
                />
                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
            </div>
            <ul className="mt-2 max-h-64 overflow-y-auto space-y-0.5">
                {!isLoading && searchResults?.length === 0 ? (
                    <li className="py-6 text-center text-sm text-muted-foreground">
                        No users found.
                    </li>
                ) : (
                    searchResults?.map((user) => (
                        <UserItem
                            key={user._id}
                            user={user}
                            onSelect={onSelect}
                            isSelected={selectedSet.has(user._id)}
                        />
                    ))
                )}
            </ul>
        </div>
    );
});

