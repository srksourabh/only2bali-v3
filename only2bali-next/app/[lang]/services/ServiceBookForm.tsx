"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BookingPayButton from "@/app/[lang]/account/BookingPayButton";
import { formatDateDdMmYyyy } from "@/lib/dates";

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
  date: string;
  success: string;
  errGeneric: string;
  protocols: { jain: string; veg: string; vegan: string };
};

export default function ServiceBookForm({
  listingId,
  lang,
  loginHref,
  signedIn,
  defaultDate,
  openDates,
  capacityMin,
  capacityMax,
  bookCopy,
  payCopy,
}: {
  listingId: string;
  lang: string;
  loginHref: string;
  signedIn: boolean;
  defaultDate: string | null;
  openDates: string[];
  capacityMin: number;
  capacityMax: number;
  bookCopy: BookCopy;
  payCopy: PayCopy;
}) {
  const router = useRouter();
  const [serviceDate, setServiceDate] = useState(defaultDate ?? "");
  const [pax, setPax] = useState(Math.max(1, capacityMin));
  const [protocol, setProtocol] = useState<"jain" | "vegetarian" | "vegan">("vegetarian");
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

  const dateOptions = useMemo(() => openDates, [openDates]);

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
          listingId,
          serviceDate,
          pax,
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
      <div className="acard" style={{ marginTop: "1rem" }}>
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

  return (
    <div className="acard" style={{ marginTop: "1rem" }}>
      {!signedIn && <p className="empty">{bookCopy.signedInRequired}</p>}
      <div className="admin-list" style={{ display: "grid", gap: ".75rem" }}>
        <label>
          {bookCopy.date}
          {dateOptions.length > 0 ? (
            <select value={serviceDate} onChange={(e) => setServiceDate(e.target.value)}>
              <option value="">—</option>
              {dateOptions.map((d) => (
                <option key={d} value={d}>
                  {formatDateDdMmYyyy(d)}
                </option>
              ))}
            </select>
          ) : (
            <input type="date" lang="en-IN" value={serviceDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setServiceDate(e.target.value)} />
          )}
        </label>
        <label>
          {bookCopy.pax}
          <input
            type="number"
            min={capacityMin}
            max={capacityMax}
            value={pax}
            onChange={(e) => setPax(Number(e.target.value))}
          />
        </label>
        <label>
          {bookCopy.protocol}
          <select value={protocol} onChange={(e) => setProtocol(e.target.value as typeof protocol)}>
            <option value="vegetarian">{bookCopy.protocols.veg}</option>
            <option value="jain">{bookCopy.protocols.jain}</option>
            <option value="vegan">{bookCopy.protocols.vegan}</option>
          </select>
        </label>
        <label>
          {bookCopy.leadName}
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} />
        </label>
      </div>
      {error && <p className="errmsg" role="alert">{error}</p>}
      {signedIn ? (
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: "1rem" }}
          disabled={busy || !serviceDate || fullName.trim().length < 2}
          onClick={submit}
        >
          {busy ? bookCopy.booking : bookCopy.bookNow}
        </button>
      ) : (
        <a className="btn btn-primary" style={{ marginTop: "1rem" }} href={loginHref}>
          {bookCopy.signIn}
        </a>
      )}
      <span className="fineprint" style={{ display: "block", marginTop: ".5rem" }}>
        {lang.toUpperCase()} · seats held 15 minutes after booking
      </span>
    </div>
  );
}
