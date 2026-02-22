"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/Sidebar";
import { ChatProvider } from "@/components/providers/ChatContext";
import { cn } from "@/lib/utils";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn, userId: clerkId } = useAuth();
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const createOrUpdate = useMutation(api.users.createOrUpdate);
  const setOnline = useMutation(api.users.setOnline);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const syncAttempted = useRef(false);

  const convexUser = useQuery(
    api.users.getByClerkId,
    clerkId ? { clerkId } : "skip"
  );

  // Sync Clerk user into Convex DB on mount
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !clerkId || !clerkUser) return;
    if (syncAttempted.current) return;
    syncAttempted.current = true;
    createOrUpdate({
      clerkId,
      name: clerkUser.fullName ?? clerkUser.firstName ?? "User",
      email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
      image: clerkUser.imageUrl ?? "",
    }).catch((err) => {
      console.error("Failed to sync user:", err);
      setSyncError(String(err));
      syncAttempted.current = false;
    });
  }, [isLoaded, isSignedIn, clerkId, clerkUser, createOrUpdate]);

  // Retry sync if convexUser is still null after 2s
  useEffect(() => {
    if (convexUser !== null) return;
    const retry = setTimeout(() => {
      syncAttempted.current = false;
    }, 2000);
    return () => clearTimeout(retry);
  }, [convexUser]);

  // Show timeout error after 8s if user still not loaded
  useEffect(() => {
    if (convexUser) return;
    const timeout = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(timeout);
  }, [convexUser]);

  useEffect(() => {
    if (!clerkId) return;
    setOnline({ clerkId, isOnline: true }).catch(() => {});
    const handleUnload = () => {
      setOnline({ clerkId, isOnline: false }).catch(() => {});
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      setOnline({ clerkId, isOnline: false }).catch(() => {});
    };
  }, [clerkId, setOnline]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace("/sign-in");
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (convexUser === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!convexUser) {
    if (timedOut || syncError) {
      return (
        <div className="flex h-screen items-center justify-center bg-white">
          <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-800 space-y-3">
            <p className="font-semibold text-base">Account setup failed</p>
            {syncError && (
              <pre className="whitespace-pre-wrap break-all bg-red-100 p-2 rounded text-xs">{syncError}</pre>
            )}
            <p>This usually means the Convex ↔ Clerk JWT integration is not configured. Make sure:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>You created a JWT template named <strong>convex</strong> in Clerk dashboard (using the Convex preset)</li>
              <li><code className="bg-red-100 px-1 rounded">npx convex dev</code> is running</li>
              <li>The domain in <code className="bg-red-100 px-1 rounded">convex/auth.config.ts</code> matches your Clerk instance</li>
            </ol>
            <button
              onClick={() => {
                setSyncError(null);
                setTimedOut(false);
                syncAttempted.current = false;
              }}
              className="mt-2 rounded bg-red-600 px-4 py-1.5 text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-gray-500 text-sm">Setting up your account…</p>
        </div>
      </div>
    );
  }

  return (
    <ChatProvider currentUser={convexUser}>
      <div className={cn("flex h-screen bg-background")}>
        <Sidebar currentUser={convexUser} />
        <main className="flex-1 flex flex-col min-w-0">{children}</main>
      </div>
    </ChatProvider>
  );
}
