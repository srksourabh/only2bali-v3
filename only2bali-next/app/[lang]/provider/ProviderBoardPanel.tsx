"use client";

import { useEffect, useState } from "react";

type RequestRow = {
  id: string;
  protocol: string;
  groupSize: number;
  nights: number | null;
  fromDate: string | null;
  departureCity: string | null;
  budgetMinAmount: number | null;
  budgetMaxAmount: number | null;
  budgetCurrency: string | null;
  specialRequirements: string | null;
  bidsCloseAt: string | null;
};

const money = (minor: number, currency: string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);

export default function ProviderBoardPanel() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [bid, setBid] = useState({ requestId: "", title: "", vendorNetAmount: "", summary: "" });

  const load = async () => {
    const res = await fetch("/api/provider/board", { cache: "no-store" });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    setRequests(json.data.requests ?? []);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const submitBid = async () => {
    if (!bid.requestId || !bid.title || !bid.vendorNetAmount) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/trip-requests/${bid.requestId}/bids`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: bid.title,
          summary: bid.summary || undefined,
          vendorNetAmount: Number(bid.vendorNetAmount),
          currency: "INR",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Bid failed");
      setBid({ requestId: "", title: "", vendorNetAmount: "", summary: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bid failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="acard">
      <h2>Open trip requests</h2>
      <p className="empty">Bid with your net amount. Only2Bali sets the traveller price from your commission rate.</p>
      {error && <p className="errmsg" role="alert">{error}</p>}
      <ul className="admin-list">
        {requests.slice(0, 10).map((r) => (
          <li key={r.id}>
            <b>
              {r.protocol} · {r.groupSize} pax
              {r.nights ? ` · ${r.nights}n` : ""}
              {r.departureCity ? ` · from ${r.departureCity}` : ""}
            </b>
            <span>
              {r.budgetMinAmount != null || r.budgetMaxAmount != null
                ? `Budget ${r.budgetMinAmount != null ? money(r.budgetMinAmount, r.budgetCurrency ?? "INR") : "—"} – ${r.budgetMaxAmount != null ? money(r.budgetMaxAmount, r.budgetCurrency ?? "INR") : "—"}`
                : "Budget open"}
              {r.specialRequirements ? ` · ${r.specialRequirements.slice(0, 80)}` : ""}
            </span>
            <button type="button" onClick={() => setBid({ ...bid, requestId: r.id, title: bid.title || `Offer for ${r.protocol} group` })}>
              Bid on this
            </button>
          </li>
        ))}
      </ul>
      {bid.requestId && (
        <div style={{ marginTop: "1rem" }}>
          <label>Offer title</label>
          <input value={bid.title} onChange={(e) => setBid({ ...bid, title: e.target.value })} />
          <label>Your net (INR paise)</label>
          <input value={bid.vendorNetAmount} onChange={(e) => setBid({ ...bid, vendorNetAmount: e.target.value })} placeholder="8500000" />
          <label>Summary</label>
          <textarea rows={2} value={bid.summary} onChange={(e) => setBid({ ...bid, summary: e.target.value })} />
          <button className="btn btn-solid btn-sm" disabled={saving} type="button" onClick={submitBid}>
            Submit bid
          </button>
        </div>
      )}
    </section>
  );
}
