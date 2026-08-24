"use client";
import { protocolOptions } from "@/lib/protocol-options";
import type { Protocol } from "@/lib/protocols";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BookingPayButton from "@/app/[lang]/account/BookingPayButton";

type PayCopy = {
  payNow: string;
  paying: string;
  paid: string;
  holdExpired: string;
  errSetup: string;
  errGeneric: string;
};

type BookCopy = {
  bookNow: string;
  booking: string;
  signedInRequired: string;
  signIn: string;
  leadName: string;
  pax: string;
  protocol: string;
  success: string;
  errGeneric: string;
  protocols: { jain: string; veg: string; vegan: string };
};

export default function PackageBookForm({
  departureId,
  label,
  seatsAvailable,
  lang,
  loginHref,
  signedIn,
  bookCopy,
  payCopy,
}: {
  departureId: string;
  label: string;
  seatsAvailable: number;
  lang: string;
  loginHref: string;
  signedIn: boolean;
  bookCopy: BookCopy;
  payCopy: PayCopy;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pax, setPax] = useState(1);
  const [protocol, setProtocol] = useState<Protocol>("vegetarian");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{
    bookingId: string;
    reference: string;
    grossAmount: number;
    currency: string;
    holdExpiresAt: string;
  } | null>(null);

  const submit = async () => {
    if (!signedIn) {
      router.push(loginHref);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const travellers = [{ fullName: fullName.trim() }];
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          departureId,
          pax,
          rooms: 1,
          protocol,
          travellers,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error ?? bookCopy.errGeneric);
      setCreated({
        bookingId: json.data.bookingId,
        reference: json.data.reference,
        grossAmount: json.data.grossAmount,
        currency: json.data.currency,
        holdExpiresAt: json.data.holdExpiresAt,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : bookCopy.errGeneric);
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    return (
      <div>
        <p className="okbox">{bookCopy.success} {created.reference}</p>
        <BookingPayButton
          bookingId={created.bookingId}
          amount={created.grossAmount}
          currency={created.currency}
          reference={created.reference}
          holdExpiresAt={created.holdExpiresAt}
          copy={payCopy}
        />
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-o btn-sm" onClick={() => setOpen(true)}>
        {bookCopy.bookNow}
      </button>
    );
  }

  return (
    <div className="pkg-book-panel">
      <p className="empty">{label} · {seatsAvailable} seats</p>
      {!signedIn && <p className="empty">{bookCopy.signedInRequired}</p>}
      <label>
        {bookCopy.pax}
        <input
          type="number"
          min={1}
          max={Math.min(30, seatsAvailable)}
          value={pax}
          onChange={(e) => setPax(Number(e.target.value))}
        />
      </label>
      <label>
        {bookCopy.protocol}
        <select value={protocol} onChange={(e) => setProtocol(e.target.value as typeof protocol)}>
          {protocolOptions(bookCopy.protocols).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        {bookCopy.leadName}
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} />
      </label>
      {error && <p className="errmsg" role="alert">{error}</p>}
      {signedIn ? (
        <button
          type="button"
          className="btn btn-solid btn-sm"
          disabled={busy || fullName.trim().length < 2}
          onClick={submit}
        >
          {busy ? bookCopy.booking : bookCopy.bookNow}
        </button>
      ) : (
        <a className="btn btn-solid btn-sm" href={loginHref}>
          {bookCopy.signIn}
        </a>
      )}
      <span className="fineprint">{lang.toUpperCase()}</span>
    </div>
  );
}
