import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { messageSchema } from "@/lib/validators/marketplace";
import {
  listMessageThreads,
  listMessagesForThread,
  sendMarketplaceMessage,
} from "@/lib/repositories/marketplace";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const threadId = url.searchParams.get("threadId");

    if (threadId) {
      const result = await listMessagesForThread(user.accountId, user.role, threadId);
      if (!result.ok) {
        return NextResponse.json({ success: false, error: "Forbidden." }, { status: 403 });
      }
      return NextResponse.json(
        { success: true, data: { unmasked: result.unmasked, messages: result.messages } },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const threads = await listMessageThreads(user.accountId, user.role);
    return NextResponse.json({ success: true, data: { threads } }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return apiError(err, "Could not load messages.");
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const parsed = messageSchema.safeParse(await readJson(req, 8_192));
    if (!parsed.success) return validationError(parsed.error);

    const result = await sendMarketplaceMessage(user.accountId, user.role, parsed.data);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: "You do not have access to this thread." }, { status: 403 });
    }
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (err) {
    return apiError(err, "Could not send message.");
  }
}
