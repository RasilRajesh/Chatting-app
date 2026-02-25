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
  const updateName = useMutation(api.users.updateName);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const syncAttempted = useRef(false);
  const prevClerkName = useRef<string | null>(null);

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

  // When the user updates their name in the Clerk profile popup,
  // clerkUser.fullName changes — push that new name into Convex.
  useEffect(() => {
    if (!clerkUser) return;
    const clerkName = clerkUser.fullName ?? clerkUser.firstName ?? "User";
    if (prevClerkName.current === null) {
      // First time — just record it, don't overwrite (createOrUpdate handles first-sync)
      prevClerkName.current = clerkName;
      return;
    }
    if (clerkName !== prevClerkName.current) {
      prevClerkName.current = clerkName;
      updateName({ name: clerkName }).catch(() => {});
    }
  }, [clerkUser, clerkUser?.fullName, clerkUser?.firstName, updateName]);

  // Show timeout error after 8s if user still not loaded
  useEffect(() => {
    if (convexUser) return;
    const timeout = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(timeout);
  }, [convexUser]);

  useEffect(() => {
    if (!clerkId) return;
    // Mark online immediately when the layout mounts
    setOnline({ clerkId, isOnline: true }).catch(() => {});

    const goOffline = () => setOnline({ clerkId, isOnline: false }).catch(() => {});
    const goOnline  = () => setOnline({ clerkId, isOnline: true  }).catch(() => {});

    // visibilitychange fires reliably when the tab is hidden/shown (including mobile)
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        goOffline();
      } else {
        goOnline();
      }
    };

    // pagehide is more reliable than beforeunload for actual navigation / close
    const handlePageHide = () => goOffline();

    // window blur/focus tracks switching away from the window on desktop
    const handleBlur  = () => goOffline();
    const handleFocus = () => goOnline();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("blur",  handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("blur",  handleBlur);
      window.removeEventListener("focus", handleFocus);
      goOffline();
    };
  }, [clerkId, setOnline]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace("/sign-in");
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (convexUser === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!convexUser) {
    if (timedOut || syncError) {
      return (
        <div className="flex h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-md rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <h1 className="text-xl font-semibold text-destructive">
              Account Sync Failed
            </h1>
            <p className="mt-2 text-sm text-destructive-foreground">
              We couldn't sync your account with our server. This might be a
              temporary issue.
            </p>
            {syncError && (
              <pre className="mt-4 whitespace-pre-wrap rounded-md bg-destructive/20 p-2 text-xs text-destructive-foreground">
                {syncError}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="ml-3 text-sm text-muted-foreground">Syncing account...</p>
        </div>
      </div>
    );
  }

  return (
    <ChatProvider currentUser={convexUser}>
      <main className="flex h-screen bg-background">
        <Sidebar currentUser={convexUser} />
        <div className="flex-1 flex flex-col min-h-0 bg-background">{children}</div>
      </main>
    </ChatProvider>
  );
}
