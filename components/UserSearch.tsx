"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Doc } from "@/convex/_generated/dataModel";

type User = Doc<"users">;

export function UserSearch({
  users,
  onSelect,
  selectedIds,
  className,
}: {
  users: User[];
  onSelect: (user: User) => void;
  selectedIds?: import("@/convex/_generated/dataModel").Id<"users">[];
  className?: string;
}) {
  const selectedSet = new Set(selectedIds ?? []);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, query]);

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
      </div>
      <ul className="mt-2 max-h-64 overflow-y-auto space-y-0.5">
        {filtered.length === 0 ? (
          <li className="py-6 text-center text-sm text-muted-foreground">
            No users found.
          </li>
        ) : (
          filtered.map((user) => (
            <li key={user._id}>
              <button
                type="button"
                onClick={() => onSelect(user)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-accent transition-colors",
                  selectedSet.has(user._id) && "bg-accent"
                )}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.image} alt={user.name} />
                  <AvatarFallback>
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    <span className={cn(
                      "flex items-center gap-1 text-xs",
                      user.isOnline ? "text-green-500" : "text-muted-foreground"
                    )}>
                      <span className={cn(
                        "inline-block h-2 w-2 rounded-full",
                        user.isOnline ? "bg-green-500" : "bg-gray-400"
                      )} />
                      {user.isOnline ? "Online" : "Offline"}
                    </span>
                  </p>
                </div>
                {selectedSet.has(user._id) && (
                  <span className="text-primary text-sm">✓</span>
                )}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
