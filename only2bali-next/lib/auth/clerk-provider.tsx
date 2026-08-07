"use client";

import { ClerkProvider } from "@clerk/nextjs";

/**
 * Wraps the tree with Clerk only when a publishable key is present so local
 * and Vercel deploys without Clerk keep working (password / OTP / Google).
 */
export default function ClerkAppProvider({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  if (!publishableKey) return <>{children}</>;
  return <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>;
}
