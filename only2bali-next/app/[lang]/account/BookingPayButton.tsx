"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PayCopy = {
  payNow: string;
  paying: string;
  paid: string;
  holdExpired: string;
  errSetup: string;
  errGeneric: string;
};

type GatewayChoice = {
  id: "stripe" | "razorpay";
  label: string;
  available: boolean;
  reason: string | null;
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

const fallbackGateways: { stripe: GatewayChoice; razorpay: GatewayChoice } = {
  stripe: { id: "stripe", label: "Stripe", available: true, reason: null },
  razorpay: { id: "razorpay", label: "Razorpay", available: true, reason: null },
};

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
  const [busy, setBusy] = useState<"stripe" | "razorpay" | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gateways, setGateways] = useState(fallbackGateways);

  const expired =
    holdExpiresAt !== null && !Number.isNaN(Date.parse(holdExpiresAt)) && Date.parse(holdExpiresAt) < Date.now();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/payments/options", { cache: "no-store" })
      .then((res) => res.json())
      .then((body) => {
        if (cancelled || !body?.data?.stripe || !body?.data?.razorpay) return;
        setGateways({ stripe: body.data.stripe, razorpay: body.data.razorpay });
      })
      .catch(() => {
        if (!cancelled) {
          setGateways({
            stripe: {
              id: "stripe",
              label: "Stripe",
              available: false,
              reason: "Could not check Stripe setup.",
            },
            razorpay: {
              id: "razorpay",
              label: "Razorpay",
              available: false,
              reason: "Could not check Razorpay setup.",
            },
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const booking = params.get("booking");
    if (!sessionId || booking !== bookingId || done || expired) return;

    let cancelled = false;
    setBusy("stripe");
    fetch("/api/payments/stripe/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, sessionId }),
    })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) {
          setError(body?.error ?? copy.errGeneric);
          setBusy(null);
          return;
        }
        setDone(true);
        setBusy(null);
        router.refresh();
      })
      .catch(() => {
        if (!cancelled) {
          setError(copy.errGeneric);
          setBusy(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId, copy.errGeneric, done, expired, router]);

  async function startPay(provider: "stripe" | "razorpay") {
    if (busy || done || expired) return;
    const choice = gateways[provider];
    if (!choice.available) {
      setError(choice.reason ?? copy.errSetup);
      return;
    }
    setBusy(provider);
    setError(null);
    try {
      const intentRes = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          provider,
          purpose: "full",
          idempotencyKey: `pay_${bookingId}_full_${provider}`,
          returnTo: window.location.pathname,
        }),
      });
      const intentBody = await intentRes.json().catch(() => null);
      if (!intentRes.ok) {
        setError(
          intentBody?.reason === "payment_setup_required"
            ? (intentBody?.error ?? copy.errSetup)
            : (intentBody?.error ?? copy.errGeneric)
        );
        setBusy(null);
        return;
      }

      const checkout = intentBody?.data?.checkout;
      if (provider === "stripe") {
        if (!checkout?.url) {
          setError(copy.errSetup);
          setBusy(null);
          return;
        }
        window.location.href = checkout.url;
        return;
      }

      if (!checkout?.orderId || !checkout?.keyId) {
        setError(copy.errSetup);
        setBusy(null);
        return;
      }

      await loadRazorpayScript();
      if (!window.Razorpay) {
        setError(copy.errGeneric);
        setBusy(null);
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
              setBusy(null);
              return;
            }
            setDone(true);
            router.refresh();
          } catch {
            setError(copy.errGeneric);
            setBusy(null);
          }
        },
        modal: {
          ondismiss: () => setBusy(null),
        },
      });

      rzp.on("payment.failed", (response) => {
        setError(response.error?.description ?? copy.errGeneric);
        setBusy(null);
      });
      rzp.open();
    } catch {
      setError(copy.errGeneric);
      setBusy(null);
    }
  }

  if (done) {
    return <span className="paystatus paystatus-ok">{copy.paid}</span>;
  }

  if (expired) {
    return <span className="paystatus">{copy.holdExpired}</span>;
  }

  const price = money(amount, currency);

  return (
    <div className="payrow">
      <p className="paychoose">Pay {price}</p>
      <div className="payoptions" role="group" aria-label="Payment methods">
        <GatewayButton
          label={`Razorpay · ${price}`}
          available={gateways.razorpay.available}
          reason={gateways.razorpay.reason}
          busy={busy === "razorpay"}
          locked={busy !== null}
          onClick={() => startPay("razorpay")}
        />
      </div>
      {error && (
        <p className="payerr" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function GatewayButton({
  label,
  available,
  reason,
  busy,
  locked,
  onClick,
}: {
  label: string;
  available: boolean;
  reason: string | null;
  busy: boolean;
  locked: boolean;
  onClick: () => void;
}) {
  return (
    <div className="payoption">
      <button
        type="button"
        className="btn btn-solid btn-sm"
        disabled={!available || locked}
        onClick={onClick}
        aria-disabled={!available}
      >
        {busy ? "Opening..." : label}
      </button>
      {!available && (
        <p className="payunavailable">{reason ?? "Unavailable"}</p>
      )}
    </div>
  );
}
