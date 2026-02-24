import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

export const metadata: Metadata = {
  title: "Live Chat",
  description: "Real-time messaging app",
};

import { ThemeProvider } from "@/components/providers/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased min-h-screen">
          <ErrorBoundary>
            <ConvexClientProvider>
              <ThemeProvider>{children}</ThemeProvider>
            </ConvexClientProvider>
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  );
}
