"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
            <ThemeInjector>{children}</ThemeInjector>
        </NextThemesProvider>
    );
}

function ThemeInjector({ children }: { children: React.ReactNode }) {
    const { setTheme, theme: currentTheme } = useTheme();
    const { user: clerkUser } = useUser();
    const user = useQuery(
        api.users.getByClerkId,
        clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
    );

    React.useEffect(() => {
        if (!user?.themeSettings) {
            console.log("ThemeProvider: No theme settings found for user.");
            return;
        }

        const { mode, accentColor, fontFamily, bubbleStyle, chatBackground } = user.themeSettings;
        console.log("ThemeProvider: Found settings:", { mode, accentColor, fontFamily, bubbleStyle, chatBackground });

        // Apply display mode
        if (mode && mode !== currentTheme) {
            console.log(`ThemeProvider: Switching mode to ${mode}`);
            setTheme(mode);
        }

        // Add new classes with validation to prevent crashes from legacy "hsl(...)" values
        const isValidToken = (t: string | undefined): t is string => !!t && !t.includes(' ') && !t.includes('(') && !t.includes(',');

        const classesToAdd: string[] = [];
        if (isValidToken(accentColor)) classesToAdd.push(`accent-theme-${accentColor}`);
        if (isValidToken(fontFamily)) classesToAdd.push(`font-theme-${fontFamily}`);
        if (isValidToken(bubbleStyle)) classesToAdd.push(`bubble-theme-${bubbleStyle}`);
        // bg-theme classes are intentionally NOT applied globally — they are applied
        // only on the messages container div inside ChatWindow so they don't bleed
        // into the sidebar/layout and cause mixed-color issues in dark mode.

        // Apply accent + font + bubble classes to BOTH html and body for maximum reliability
        const elements = [document.documentElement, document.body];

        elements.forEach(el => {
            // Remove old classes
            const classesToRemove = Array.from(el.classList).filter(c =>
                c.includes('accent-theme-') ||
                c.includes('font-theme-') ||
                c.includes('bubble-theme-') ||
                c.includes('bg-theme-')  // also clean up any previously applied bg classes
            );
            if (classesToRemove.length > 0) el.classList.remove(...classesToRemove);

            // Add new classes
            if (classesToAdd.length > 0) el.classList.add(...classesToAdd);
        });

        console.log("ThemeProvider: Updated theme status:", classesToAdd);

    }, [user, user?.themeSettings, setTheme, currentTheme]);

    return <>{children}</>;
}
