import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth";
import { clerkConfigured, pickVerifiedEmail } from "@/lib/auth/clerk";
import { signInWithOAuthProfile } from "@/lib/auth/service";
import { apiError } from "@/lib/api";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  role: z.enum(["traveller", "vendor"]),
});

/**
 * After Clerk OAuth succeeds, mint the app's `o2b_session` so existing
 * requireRole / account.role gates keep working unchanged.
 */
export async function POST(req: Request) {
  try {
    if (!clerkConfigured()) {
      return NextResponse.json(
        { success: false, error: "Clerk is not configured.", reason: "clerk_not_configured" },
        { status: 503 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Sign in with Clerk first." }, { status: 401 });
    }

    const user = await currentUser();
    const email = pickVerifiedEmail(user?.emailAddresses ?? undefined, user?.primaryEmailAddressId ?? null);
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Your Clerk account needs a verified email." },
        { status: 403 }
      );
    }

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Choose traveller or vendor." }, { status: 400 });
    }

    const result = await signInWithOAuthProfile(
      {
        provider: "clerk",
        providerAccountId: userId,
        email,
        name: [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username,
      },
      parsed.data.role,
      {
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
        userAgent: req.headers.get("user-agent") ?? undefined,
      }
    );

    if (!result.ok) {
      const message =
        result.reason === "role_mismatch"
          ? "This email is already registered with a different role."
          : "Could not complete sign-in.";
      return NextResponse.json({ success: false, error: message, reason: result.reason }, { status: 403 });
    }

    const res = NextResponse.json({
      success: true,
      data: { accountId: result.accountId, isNewAccount: result.isNewAccount },
    });
    res.cookies.set(SESSION_COOKIE, result.token, sessionCookieOptions(result.expiresAt));
    return res;
  } catch (err) {
    return apiError(err, "Could not bridge Clerk session.");
  }
}
