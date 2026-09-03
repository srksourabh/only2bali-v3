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
  const [offersLoading, setOffersLoading] = useState(false);
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ id: string; body: string; sentAt: string }>>([]);
  const [unmasked, setUnmasked] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [creating, setCreating] = useState(false);
  const [mobileVerified, setMobileVerified] = useState<boolean | null>(null);
  const [mobileForm, setMobileForm] = useState({ mobile: "", code: "", sent: false });
  const [form, setForm] = useState({
    protocol: "vegetarian",
    groupSize: "8",
    departureCity: "",
    flexibleMonth: "",
    notes: "",
  });

  const load = async () => {
    const [reqRes, thrRes, sessionRes] = await Promise.all([
      fetch("/api/trip-requests", { cache: "no-store" }),
      fetch("/api/messages", { cache: "no-store" }),
      fetch("/api/auth/session", { cache: "no-store" }),
    ]);
    const reqJson = await reqRes.json();
    if (reqJson.success) setRequests(reqJson.data.requests ?? []);
    const thrJson = await thrRes.json();
    if (thrJson.success) setThreads(thrJson.data.threads ?? []);
    const sessionJson = await sessionRes.json();
    if (sessionJson.success) setMobileVerified(Boolean(sessionJson.data?.user?.mobileVerifiedAt));
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const loadOffers = async (requestId: string) => {
    setSelected(requestId);
    setInfo("");
    setError("");
    setOffers([]);
    setOffersLoading(true);
    try {
      const res = await fetch(`/api/trip-requests/${requestId}/offers`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error ?? "Could not load offers.");
      setOffers(json.data.offers ?? []);
    } finally {
      setOffersLoading(false);
    }
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

  const createRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setCreating(true);
    try {
      const res = await fetch("/api/trip-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          protocol: form.protocol,
          groupSize: Number(form.groupSize),
          departureCity: form.departureCity || undefined,
          flexibleMonth: form.flexibleMonth || undefined,
          notes: form.notes || undefined,
          publishToProviders: true,
          budgetBasis: "unsure",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Could not create that request.");
      setInfo(
        json.data.publishedToProviders
          ? "Request published to verified providers."
          : "Request saved. Verify a mobile number to publish it to the provider board."
      );
      setForm({ ...form, notes: "" });
      await load();
    } finally {
      setCreating(false);
    }
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
        {false && mobileVerified === false && (
          <form
            className="leadform"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              setInfo("");
              try {
                if (!mobileForm.sent) {
                  const res = await fetch("/api/auth/verify-mobile/request", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ mobile: mobileForm.mobile }),
                  });
                  const json = await res.json();
                  if (!res.ok || !json.success) throw new Error(json.error ?? "Could not send a code.");
                  setMobileForm({ ...mobileForm, sent: true });
                  setInfo("Enter the six-digit code sent to that number.");
                  return;
                }
                const res = await fetch("/api/auth/verify-mobile/confirm", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ mobile: mobileForm.mobile, code: mobileForm.code }),
                });
                const json = await res.json();
                if (!res.ok || !json.success) throw new Error(json.error ?? "Could not verify that number.");
                setMobileVerified(true);
                setInfo("Mobile verified. New trip requests can go to the provider board.");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Could not send a code.");
              }
            }}
          >
            <h3>Verify a mobile number</h3>
            <p className="empty">Providers only see published requests after a mobile is verified.</p>
            <label>
              Mobile with country code
              <input
                value={mobileForm.mobile}
                onChange={(e) => setMobileForm({ ...mobileForm, mobile: e.target.value })}
                placeholder="+9198XXXXXXXX"
                required
              />
            </label>
            {mobileForm.sent && (
              <label>
                Six-digit code
                <input
                  value={mobileForm.code}
                  onChange={(e) => setMobileForm({ ...mobileForm, code: e.target.value })}
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
              </label>
            )}
            <button className="btn btn-ghost btn-sm" type="submit">
              {mobileForm.sent ? "Confirm number" : "Send code"}
            </button>
          </form>
        )}
        <form className="leadform" onSubmit={(e) => createRequest(e).catch((err) => setError(err.message))}>
          <h3>Post a trip request</h3>
          <label>
            Food protocol
            <select
              value={form.protocol}
              onChange={(e) => setForm({ ...form, protocol: e.target.value })}
            >
              <option value="jain">Jain</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
            </select>
          </label>
          <label>
            Group size
            <input
              type="number"
              min={1}
              max={500}
              value={form.groupSize}
              onChange={(e) => setForm({ ...form, groupSize: e.target.value })}
              required
            />
          </label>
          <label>
            Departure city
            <input
              value={form.departureCity}
              onChange={(e) => setForm({ ...form, departureCity: e.target.value })}
              placeholder="Mumbai"
            />
          </label>
          <label>
            Travel month
            <input
              value={form.flexibleMonth}
              onChange={(e) => setForm({ ...form, flexibleMonth: e.target.value })}
              placeholder="October"
            />
          </label>
          <label>
            What do you need?
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Villa with Jain kitchen, Hindi guide, 6 nights"
            />
          </label>
          <button className="btn btn-solid btn-sm" type="submit" disabled={creating}>
            {creating ? "Sending…" : "Send to verified providers"}
          </button>
        </form>
        <Link className="btn btn-ghost btn-sm" href={`/${lang}/inquiry`}>
          Or start from the enquiry form
        </Link>
      </section>

      {selected && (
        <section className="acard" aria-live="polite">
          <h2>Offer comparison</h2>
          {offersLoading && <p className="empty">Loading provider offers...</p>}
          {!offersLoading && offers.length === 0 && (
            <p className="empty">No provider offers have arrived for this request yet.</p>
          )}
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
