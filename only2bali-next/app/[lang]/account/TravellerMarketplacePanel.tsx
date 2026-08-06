"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type RequestRow = {
  id: string;
  status: string;
  protocol: string;
  groupSize: number;
  fromDate: string | null;
  visibility: string;
};

type OfferRow = {
  id: string;
  title: string;
  totalAmount: number;
  currency: string;
  status: string;
  businessName: string | null;
  vendorSlug: string | null;
  ratingAvg: string | null;
  ratingCount: number | null;
  summary: string | null;
};

type ThreadRow = {
  id: string;
  tripRequestId: string | null;
  businessName: string | null;
  bookingId: string | null;
};

const money = (minor: number, currency: string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);

export default function TravellerMarketplacePanel({ lang }: { lang: string }) {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ id: string; body: string; sentAt: string }>>([]);
  const [unmasked, setUnmasked] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const load = async () => {
    const [reqRes, thrRes] = await Promise.all([
      fetch("/api/trip-requests", { cache: "no-store" }),
      fetch("/api/messages", { cache: "no-store" }),
    ]);
    const reqJson = await reqRes.json();
    if (reqJson.success) setRequests(reqJson.data.requests ?? []);
    const thrJson = await thrRes.json();
    if (thrJson.success) setThreads(thrJson.data.threads ?? []);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const loadOffers = async (requestId: string) => {
    setSelected(requestId);
    setInfo("");
    const res = await fetch(`/api/trip-requests/${requestId}/offers`, { cache: "no-store" });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    setOffers(json.data.offers ?? []);
  };

  const loadThread = async (id: string) => {
    setThreadId(id);
    const res = await fetch(`/api/messages?threadId=${id}`, { cache: "no-store" });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    setUnmasked(Boolean(json.data.unmasked));
    setMessages(json.data.messages ?? []);
  };

  const accept = async (offerId: string) => {
    setError("");
    const res = await fetch(`/api/offers/${offerId}?action=accept`, { method: "POST" });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error ?? "Accept failed");
    setInfo(`Offer accepted. Booking ${json.data.booking.reference} — pay from Bookings.`);
    if (selected) await loadOffers(selected);
    await load();
  };

  const send = async () => {
    if (!threadId || !draft.trim()) return;
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ threadId, body: draft }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error ?? "Send failed");
    setDraft("");
    await loadThread(threadId);
  };

  return (
    <>
      <section className="acard">
        <h2>Your trip requests</h2>
        <p className="empty">Compare provider offers. Contact details stay masked until booking is confirmed.</p>
        {error && <p className="errmsg" role="alert">{error}</p>}
        {info && <p className="okbox">{info}</p>}
        <ul className="admin-list">
          {requests.map((r) => (
            <li key={r.id}>
              <b>
                {r.protocol} · {r.groupSize} pax · {r.status}
              </b>
              <span>{r.visibility}{r.fromDate ? ` · ${r.fromDate}` : ""}</span>
              <button type="button" onClick={() => loadOffers(r.id).catch((e) => setError(e.message))}>
                Compare offers
              </button>
            </li>
          ))}
        </ul>
        <Link className="btn btn-ghost btn-sm" href={`/${lang}/planner`}>
          Create another request
        </Link>
      </section>

      {selected && (
        <section className="acard">
          <h2>Offer comparison</h2>
          <ul className="admin-list">
            {offers.map((o) => (
              <li key={o.id}>
                <b>{o.title}</b>
                <span>
                  {o.businessName ?? "Provider"}
                  {o.ratingCount ? ` · ★ ${o.ratingAvg} (${o.ratingCount})` : ""}
                  {" · "}
                  {money(o.totalAmount, o.currency)} · {o.status}
                </span>
                {o.summary && <span>{o.summary}</span>}
                {["sent", "viewed", "shortlisted", "revision_requested"].includes(o.status) && (
                  <div className="mini-actions">
                    <button type="button" onClick={() => accept(o.id).catch((e) => setError(e.message))}>
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        fetch(`/api/offers/${o.id}?action=decline`, {
                          method: "POST",
                          headers: { "content-type": "application/json" },
                          body: "{}",
                        }).then(() => loadOffers(selected!))
                      }
                    >
                      Decline
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="acard">
        <h2>Messages</h2>
        <p className="empty">
          {unmasked ? "Booking confirmed — contacts visible." : "Pre-booking: phones, emails and links are masked."}
        </p>
        <ul className="admin-list">
          {threads.map((t) => (
            <li key={t.id}>
              <b>{t.businessName ?? "Provider"}</b>
              <span>{t.bookingId ? "linked booking" : "pre-booking"}</span>
              <button type="button" onClick={() => loadThread(t.id).catch((e) => setError(e.message))}>
                Open
              </button>
            </li>
          ))}
        </ul>
        {threadId && (
          <div>
            <ul className="why">
              {messages.map((m) => (
                <li key={m.id}>
                  <span>{m.body}</span>
                </li>
              ))}
            </ul>
            <textarea rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message" />
            <button className="btn btn-solid btn-sm" type="button" onClick={() => send().catch((e) => setError(e.message))}>
              Send
            </button>
          </div>
        )}
      </section>
    </>
  );
}
