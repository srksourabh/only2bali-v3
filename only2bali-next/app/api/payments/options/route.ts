import { NextResponse } from "next/server";
import { paymentGatewayOptions } from "@/lib/payments/config";

export const dynamic = "force-dynamic";

/** Public: both gateways are always listed; secrets never leave the server. */
export async function GET() {
  const options = paymentGatewayOptions();
  return NextResponse.json(
    { success: true, data: { stripe: options.stripe, razorpay: options.razorpay } },
    { headers: { "Cache-Control": "no-store" } }
  );
}
