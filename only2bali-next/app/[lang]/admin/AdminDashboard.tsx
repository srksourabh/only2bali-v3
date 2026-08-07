"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Overview {
  vendors: Array<{ id: string; businessName: string; verificationStatus: string }>;
  applications: Array<{ id: string; businessName: string; businessType: string; status: string }>;
  listings: Array<{ id: string; title: string; priceAmount: number; tier: string; status: string; active: boolean }>;
  media: Array<{ id: string; fileUrl: string; kind: string; approved: boolean }>;
  events: Array<{ id: string; title: string; status: string }>;
  promotions: Array<{ id: string; title: string; priceAmount: number | null; status: string }>;
  documents: Array<{ id: string; kind: string; fileUrl: string; status: string; vendorId: string }>;
}

type Disbursement = {
  id: string;
  bookingReference: string;
  businessName: string;
  netAmount: number;
  travellerCurrency: string;
  status: string;
  holdReason: string | null;
  paymentId: string | null;
};

async function patch(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) throw new Error(json?.error ?? "Request failed.");
}

export default function AdminDashboard() {
  const params = useParams();
  const lang = String(params.lang ?? "en");
  const [data, setData] = useState<Overview | null>(null);
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [priceDraft, setPriceDraft] = useState<Record<string, string>>({});

  const load = async () => {
    const [overviewRes, disbRes] = await Promise.all([
      fetch("/api/admin/overview", { cache: "no-store" }),
      fetch("/api/admin/disbursements", { cache: "no-store" }),
    ]);
    const json = await overviewRes.json();
    if (!json.success) throw new Error(json.error);
    setData(json.data);
    const dJson = await disbRes.json();
    if (dJson.success) setDisbursements(dJson.data.disbursements ?? []);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const run = async (label: string, fn: () => Promise<void>) => {
    setError("");
    setSaved("");
    try {
      await fn();
      await load();
      setSaved(label);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <main className="accountpage">
      <div className="o2b-wrap">
        <header className="accounthead">
          <div>
            <span className="eyebrow">Admin control</span>
            <h1>Verify providers, rates, pictures and offers</h1>
            <p className="empty">Approve applications, verify providers, then publish listings travellers can book. All changes are audit logged.</p>
            <p className="empty">
              <Link href={`/${lang}/admin/settings`}>Integration settings (API keys)</Link>
            </p>
          </div>
        </header>

        {error && <p className="errmsg" role="alert">{error}</p>}
        {saved && <p className="okbox">{saved}</p>}

        <div className="accountgrid admin-grid">
          <section className="acard">
            <h2>Provider applications</h2>
            <p className="empty">{data?.applications.length ?? 0} applications in the system.</p>
            <ul className="admin-list">
              {data?.applications.slice(0, 8).map((item) => (
                <li key={item.id}>
                  <b>{item.businessName}</b>
                  <span>{item.businessType} - {item.status}</span>
                  <div className="mini-actions">
                    <button onClick={() => run("Application approved.", () => patch(`/api/admin/applications/${item.id}`, { status: "verified" }))}>Approve</button>
                    <button onClick={() => run("Application under review.", () => patch(`/api/admin/applications/${item.id}`, { status: "in_review" }))}>Review</button>
                    <button onClick={() => run("Application rejected.", () => patch(`/api/admin/applications/${item.id}`, { status: "rejected" }))}>Reject</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="acard">
            <h2>Service rates</h2>
            <ul className="admin-list">
              {data?.listings.slice(0, 10).map((item) => (
                <li key={item.id}>
                  <b>{item.title}</b>
                  <span>{item.status} - {item.active ? "live" : "hidden"}</span>
                  <input
                    value={priceDraft[item.id] ?? String(item.priceAmount)}
                    onChange={(e) => setPriceDraft({ ...priceDraft, [item.id]: e.target.value })}
                    aria-label={`Price for ${item.title}`}
                  />
                  <div className="mini-actions">
                    <button onClick={() => run("Rate updated.", () => patch(`/api/admin/listings/${item.id}`, { priceAmount: Number(priceDraft[item.id] ?? item.priceAmount) }))}>Fix rate</button>
                    <button onClick={() => run("Listing published.", () => patch(`/api/admin/listings/${item.id}`, { status: "active", active: true }))}>Publish</button>
                    <button onClick={() => run("Listing paused.", () => patch(`/api/admin/listings/${item.id}`, { status: "paused", active: false }))}>Pause</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="acard">
            <h2>KYC documents</h2>
            <p className="empty">
              {(data?.documents.filter((d) => d.status === "pending").length ?? 0)} pending review.
            </p>
            <ul className="admin-list">
              {data?.documents.slice(0, 12).map((item) => (
                <li key={item.id}>
                  <b>{item.kind.replaceAll("_", " ")}</b>
                  <span>{item.status} - {item.fileUrl}</span>
                  {item.status === "pending" && (
                    <div className="mini-actions">
                      <button onClick={() => run("Document approved.", () => patch(`/api/admin/documents/${item.id}`, { status: "approved" }))}>Approve</button>
                      <button onClick={() => run("Document rejected.", () => patch(`/api/admin/documents/${item.id}`, { status: "rejected" }))}>Reject</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="acard">
            <h2>Pictures</h2>
            <ul className="admin-list">
              {data?.media.slice(0, 10).map((item) => (
                <li key={item.id}>
                  <b>{item.kind}</b>
                  <span>{item.approved ? "approved" : "pending"} - {item.fileUrl}</span>
                  <div className="mini-actions">
                    <button onClick={() => run("Picture approved.", () => patch(`/api/admin/media/${item.id}`, { approved: true }))}>Approve</button>
                    <button onClick={() => run("Picture hidden.", () => patch(`/api/admin/media/${item.id}`, { approved: false }))}>Hide</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="acard">
            <h2>Events</h2>
            <ul className="admin-list">
              {data?.events.slice(0, 10).map((item) => (
                <li key={item.id}>
                  <b>{item.title}</b>
                  <span>{item.status}</span>
                  <div className="mini-actions">
                    <button onClick={() => run("Event announced.", () => patch(`/api/admin/events/${item.id}`, { status: "published" }))}>Announce</button>
                    <button onClick={() => run("Event paused.", () => patch(`/api/admin/events/${item.id}`, { status: "paused" }))}>Pause</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="acard">
            <h2>Discounts and offers</h2>
            <ul className="admin-list">
              {data?.promotions.slice(0, 10).map((item) => (
                <li key={item.id}>
                  <b>{item.title}</b>
                  <span>{item.status} {item.priceAmount ? `- ${item.priceAmount}` : ""}</span>
                  <div className="mini-actions">
                    <button onClick={() => run("Offer published.", () => patch(`/api/admin/promotions/${item.id}`, { status: "published" }))}>Publish</button>
                    <button onClick={() => run("Offer paused.", () => patch(`/api/admin/promotions/${item.id}`, { status: "paused" }))}>Pause</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="acard">
            <h2>Payout queue</h2>
            <p className="empty">Escrow holds release after trip start / voucher. Live PA-CB transfer is owner-gated; mark paid after bank rail settles.</p>
            <ul className="admin-list">
              {disbursements.slice(0, 12).map((item) => (
                <li key={item.id}>
                  <b>{item.businessName}</b>
                  <span>
                    {item.bookingReference} · {item.status} · {item.netAmount} {item.travellerCurrency}
                    {item.holdReason ? ` · ${item.holdReason}` : ""}
                  </span>
                  <div className="mini-actions">
                    {item.status === "held" && (
                      <button onClick={() => run("Escrow released.", () => patch(`/api/admin/disbursements/${item.id}`, { action: "release_hold" }))}>Release hold</button>
                    )}
                    {(item.status === "pending" || item.status === "held") && (
                      <button onClick={() => run("Payout approved.", () => patch(`/api/admin/disbursements/${item.id}`, { action: "approve" }))}>Approve</button>
                    )}
                    {(item.status === "approved" || item.status === "processing") && (
                      <button onClick={() => run("Marked paid.", () => patch(`/api/admin/disbursements/${item.id}`, { action: "mark_paid" }))}>Mark paid</button>
                    )}
                    {item.paymentId && item.status !== "paid" && (
                      <button onClick={() => run("Traveller refunded from platform.", () => fetch(`/api/admin/payments/${item.paymentId}/refund`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }).then(async (r) => { const j = await r.json(); if (!r.ok || !j.success) throw new Error(j.error); }))}>Refund traveller</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="acard">
            <h2>Provider network</h2>
            <p className="empty">{data?.vendors.length ?? 0} providers visible to admin.</p>
            <ul className="admin-list">
              {data?.vendors.slice(0, 8).map((item) => (
                <li key={item.id}>
                  <b>{item.businessName}</b>
                  <span>{item.verificationStatus}</span>
                  <div className="mini-actions">
                    <button onClick={() => run("Provider verified.", () => patch(`/api/admin/vendors/${item.id}`, { verificationStatus: "verified" }))}>Verify</button>
                    <button onClick={() => run("Provider suspended.", () => patch(`/api/admin/vendors/${item.id}`, { verificationStatus: "suspended", rejectionReason: "Suspended by admin" }))}>Suspend</button>
                    <button onClick={() => run("Provider rejected.", () => patch(`/api/admin/vendors/${item.id}`, { verificationStatus: "rejected", rejectionReason: "Rejected by admin" }))}>Reject</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
