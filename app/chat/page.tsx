"use client";

import { MessageSquare } from "lucide-react";

export default function ChatIndexPage() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center text-center p-8 bg-white/50">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Your Messages</h2>
            <p className="text-muted-foreground mt-2 max-w-sm">
                Select a conversation from the sidebar to start chatting, or start a new one.
            </p>
        </div>
    );
}
