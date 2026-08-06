"use client";

import { useState } from "react";

export default function ReviewForm({
  bookingId,
  direction,
  copy,
}: {
  bookingId: string;
  direction: "traveller_to_vendor" | "vendor_to_traveller";
  copy: { heading: string; submit: string; thanks: string; prompt: string };
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookingId, direction, rating, comment: comment || undefined }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error ?? "Could not save rating.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save rating.");
    } finally {
      setBusy(false);
    }
  };

  if (done) return <p className="okbox">{copy.thanks}</p>;

  return (
    <div className="review-form">
      <p className="empty">{copy.prompt}</p>
      <label>
        {copy.heading}
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))} aria-label="Rating">
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} / 5
            </option>
          ))}
        </select>
      </label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Optional comment"
      />
      {error && <p className="errmsg" role="alert">{error}</p>}
      <button className="btn btn-solid btn-sm" type="button" disabled={busy} onClick={submit}>
        {busy ? "…" : copy.submit}
      </button>
    </div>
  );
}
