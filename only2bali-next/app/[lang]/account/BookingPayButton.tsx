"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PayCopy = {
  payNow: string;
  paying: string;
  paid: string;
  holdExpired: string;
  errSetup: string;
  errGeneric: string;
};

type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckout = {
  open: () => void;
  on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckout;
  }
}

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-o2b-razorpay="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Razorpay script failed to load.")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.o2bRazorpay = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay script failed to load."));
    document.body.appendChild(script);
  });
}

const money = (minor: number, currency: string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);

export default function BookingPayButton({
  bookingId,
  amount,
  currency,
  reference,
  holdExpiresAt,
  copy,
}: {
  bookingId: string;
  amount: number;
  currency: string;
  reference: string;
  holdExpiresAt: string | null;
  copy: PayCopy;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expired =
    holdExpiresAt !== null && !Number.isNaN(Date.parse(holdExpiresAt)) && Date.parse(holdExpiresAt) < Date.now();

  async function startPay() {
    if (busy || done || expired) return;
    setBusy(true);
    setError(null);
    try {
      const intentRes = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          provider: "razorpay",
          purpose: "full",
          idempotencyKey: `pay_${bookingId}_full`,
        }),
      });
      const intentBody = await intentRes.json().catch(() => null);
      if (!intentRes.ok) {
        setError(
          intentBody?.reason === "payment_setup_required"
            ? copy.errSetup
            : intentBody?.error ?? copy.errGeneric
        );
        setBusy(false);
        return;
      }

      const checkout = intentBody?.data?.checkout;
      if (!checkout?.orderId || !checkout?.keyId) {
        setError(copy.errSetup);
        setBusy(false);
        return;
      }

      await loadRazorpayScript();
      if (!window.Razorpay) {
        setError(copy.errGeneric);
        setBusy(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: checkout.keyId,
        amount,
        currency,
        order_id: checkout.orderId,
        name: "Only2Bali",
        description: `Booking ${reference}`,
        handler: async (response: RazorpaySuccess) => {
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                bookingId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyBody = await verifyRes.json().catch(() => null);
            if (!verifyRes.ok) {
              setError(verifyBody?.error ?? copy.errGeneric);
              setBusy(false);
              return;
            }
            setDone(true);
            router.refresh();
          } catch {
            setError(copy.errGeneric);
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => setBusy(false),
        },
      });

      rzp.on("payment.failed", (response) => {
        setError(response.error?.description ?? copy.errGeneric);
        setBusy(false);
      });
      rzp.open();
    } catch {
      setError(copy.errGeneric);
      setBusy(false);
    }
  }

  if (done) {
    return <span className="paystatus paystatus-ok">{copy.paid}</span>;
  }

  if (expired) {
    return <span className="paystatus">{copy.holdExpired}</span>;
  }

  return (
    <div className="payrow">
      <button type="button" className="btn btn-solid btn-sm" disabled={busy} onClick={startPay}>
        {busy ? copy.paying : `${copy.payNow} · ${money(amount, currency)}`}
      </button>
      {error && <p className="payerr" role="alert">{error}</p>}
    </div>
  );
}
