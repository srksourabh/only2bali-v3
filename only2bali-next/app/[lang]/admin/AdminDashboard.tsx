"use client";

import { useEffect, useState } from "react";

type DeskPayment = {
  bookingId: string;
  reference: string;
  travellerName: string;
  pax: number;
  amount: number;
  currency: string;
  bookingStatus: string;
  paymentStatus: string | null;
  provider: string | null;
  capturedAt: string | null;
  vendorNet?: number | null;
  disbursementStatus?: string | null;
};

type DeskVendor = {
  id: string;
  businessName: string;
  verificationStatus: string;
  assignedTo: string | null;
  assignedUsername: string | null;
  payments: DeskPayment[];
};

type AdminLead = {
  id: string;
  name: string | null;
  email: string | null;
  mobile: string | null;
  protocol: string | null;
  groupSize: number | null;
  status: string;
  message: string | null;
  createdAt: string;
};

type AdminThread = {
  id: string;
  tripRequestId: string | null;
  vendorId: string | null;
  bookingId: string | null;
  status: string;
  createdAt: string;
  businessName: string | null;
};

type ThreadMessage = {
  id: string;
  senderAccountId: string | null;
  body: string;
  contactAttemptDetected: boolean;
  sentAt: string;
};

interface Overview {
  vendors: Array<{ id: string; businessName: string; verificationStatus: string }>;
  applications: Array<{ id: string; businessName: string; businessType: string; status: string }>;
  listings: Array<{ id: string; title: string; priceAmount: number; tier: string; status: string; active: boolean }>;
  media: Array<{ id: string; fileUrl: string; kind: string; approved: boolean }>;
  events: Array<{ id: string; title: string; status: string }>;
  promotions: Array<{ id: string; title: string; priceAmount: number | null; status: string }>;
  documents: Array<{ id: string; kind: string; fileUrl: string; status: string; vendorId: string }>;
  leads: AdminLead[];
  threads: AdminThread[];
  desk?: {
    staff: Array<{ id: string; username: string }>;
    vendors: DeskVendor[];
  };
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

function formatMoney(minor: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(minor / 100);
}

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
  const [data, setData] = useState<Overview | null>(null);
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [priceDraft, setPriceDraft] = useState<Record<string, string>>({});
  const [platformFeePercent, setPlatformFeePercent] = useState("10");
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);

  const load = async () => {
    const [overviewRes, disbRes, settingsRes] = await Promise.all([
      fetch("/api/admin/overview", { cache: "no-store" }),
      fetch("/api/admin/disbursements", { cache: "no-store" }),
      fetch("/api/admin/settings", { cache: "no-store" }),
    ]);
    const json = await overviewRes.json();
    if (!json.success) throw new Error(json.error);
    setData(json.data);
    const dJson = await disbRes.json();
    if (dJson.success) setDisbursements(dJson.data.disbursements ?? []);
    const sJson = await settingsRes.json();
    if (sJson.success && sJson.data?.platformFee?.percent != null) {
      setPlatformFeePercent(String(sJson.data.platformFee.percent));
    }
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const viewThread = async (threadId: string) => {
    setError("");
    setOpenThreadId(threadId);
    setThreadLoading(true);
    try {
      const res = await fetch(`/api/messages?threadId=${threadId}`, { cache: "no-store" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setThreadMessages(json.data.messages ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load messages.");
    } finally {
      setThreadLoading(false);
    }
  };

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
            <p className="empty">Assign a developer to each vendor, see who paid what, then approve applications and publish listings. All changes are audit logged.</p>
          </div>
        </header>

        {(error || saved) && (
          <div className="admin-feedback">
            {error && <p className="errmsg" role="alert">{error}</p>}
            {saved && <p className="okbox">{saved}</p>}
          </div>
        )}

        <div className="accountgrid admin-grid">
          <section className="acard">
            <h2>Platform fee %</h2>
            <p className="empty">
              Default take on new catalogue bookings. Traveller pays 100%; Only2Bali keeps this percent and the vendor is owed the rest. Existing vendor rates (often 12-18%) still override this default on listing and offer bookings.
            </p>
            <label htmlFor="platform-fee-percent">Platform fee %</label>
            <input
              id="platform-fee-percent"
              type="number"
              min={0}
              max={50}
              step={0.1}
              value={platformFeePercent}
              onChange={(e) => setPlatformFeePercent(e.target.value)}
              aria-describedby="platform-fee-help"
            />
            <p id="platform-fee-help" className="empty">
              Current value applies to new bookings only. Money is stored as integer paise; this percent becomes a decimal rate like 0.1000.
            </p>
            <div className="mini-actions">
              <button
                onClick={() =>
                  run("Platform fee saved.", () =>
                    patch("/api/admin/settings", { platformFeePercent: Number(platformFeePercent) })
                  )
                }
              >
                Save platform fee
              </button>
            </div>
          </section>

          <section className="acard desk-card">
            <h2>Vendor desk</h2>
            <p className="empty">
              Which developer is tied to which vendor, plus every traveller payment on that account. Unassigned vendors need a developer before follow-up.
            </p>
            <ul className="admin-list">
              {(data?.desk?.vendors ?? []).map((item) => (
                <li key={item.id}>
                  <b>{item.businessName}</b>
                  <span>
                    {item.verificationStatus}
                    {item.assignedUsername ? ` · developer ${item.assignedUsername}` : " · unassigned"}
                    {` · ${item.payments.length} payment${item.payments.length === 1 ? "" : "s"}`}
                  </span>
                  <label htmlFor={`desk-dev-${item.id}`}>Assigned developer</label>
                  <select
                    id={`desk-dev-${item.id}`}
                    value={item.assignedTo ?? ""}
                    onChange={(e) =>
                      run("Developer assigned.", () =>
                        patch(`/api/admin/vendors/${item.id}`, {
                          assignedTo: e.target.value ? e.target.value : null,
                        })
                      )
                    }
                  >
                    <option value="">Unassigned</option>
                    {(data?.desk?.staff ?? []).map((dev) => (
                      <option key={dev.id} value={dev.id}>
                        {dev.username}
                      </option>
                    ))}
                  </select>
                  {item.payments.length === 0 ? (
                    <p className="empty">No bookings or payments yet.</p>
                  ) : (
                    <ul className="admin-list desk-payments">
                      {item.payments.map((pay, idx) => (
                        <li key={`${pay.bookingId}-${idx}`}>
                          <b>{pay.travellerName}</b>
                          <span>
                            {pay.reference} · {pay.pax} pax · {formatMoney(pay.amount, pay.currency)}
                            {pay.provider ? ` · ${pay.provider}` : ""}
                            {` · booking ${pay.bookingStatus}`}
                            {pay.paymentStatus ? ` · paid ${pay.paymentStatus}` : " · not paid"}
                            {pay.vendorNet != null ? ` · vendor net ${formatMoney(pay.vendorNet, pay.currency)}` : ""}
                            {pay.disbursementStatus ? ` · payout ${pay.disbursementStatus}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="acard">
            <h2>Provider applications</h2>
            <p className="empty">{data?.applications.length ?? 0} applications in the system. Approve creates or links a vendor account on the applicant email and marks it verified.</p>
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
                  <span>{item.status} - </span>
                  <a href={`/api/documents/${item.id}/file`} target="_blank" rel="noopener noreferrer">view file</a>
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

          <section className="acard">
            <h2>Leads / enquiries</h2>
            <p className="empty">{data?.leads.length ?? 0} enquiries, newest first.</p>
            <ul className="admin-list">
              {data?.leads.slice(0, 20).map((item) => (
                <li key={item.id}>
                  <b>{item.name || "Unnamed"}</b>
                  <span>
                    {item.email || item.mobile || "no contact"}
                    {item.protocol ? ` · ${item.protocol}` : ""}
                    {item.groupSize ? ` · ${item.groupSize} pax` : ""}
                    {` · ${item.status}`}
                  </span>
                  {item.message && <p className="empty">{item.message}</p>}
                  <label htmlFor={`lead-status-${item.id}`}>Status</label>
                  <select
                    id={`lead-status-${item.id}`}
                    value={item.status}
                    onChange={(e) =>
                      run("Lead status updated.", () => patch(`/api/admin/leads/${item.id}`, { status: e.target.value }))
                    }
                  >
                    {["new", "contacted", "quoted", "converted", "lost"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          </section>

          <section className="acard">
            <h2>Traveller ↔ vendor communication</h2>
            <p className="empty">
              {data?.threads.length ?? 0} threads. Admin sees full unmasked text for moderation.
            </p>
            <ul className="admin-list">
              {data?.threads.slice(0, 20).map((item) => (
                <li key={item.id}>
                  <b>{item.businessName ?? "Unknown vendor"}</b>
                  <span>{item.status}{item.bookingId ? " · has booking" : ""}</span>
                  <div className="mini-actions">
                    <button onClick={() => viewThread(item.id)}>View messages</button>
                    <button onClick={() => run("Thread flagged.", () => patch(`/api/admin/threads/${item.id}`, { status: "flagged" }))}>Flag</button>
                    <button onClick={() => run("Thread closed.", () => patch(`/api/admin/threads/${item.id}`, { status: "closed" }))}>Close</button>
                    {item.status !== "open" && (
                      <button onClick={() => run("Thread reopened.", () => patch(`/api/admin/threads/${item.id}`, { status: "open" }))}>Reopen</button>
                    )}
                  </div>
                  {openThreadId === item.id && (
                    <div className="admin-thread-view">
                      {threadLoading ? (
                        <p className="empty">Loading messages…</p>
                      ) : threadMessages.length === 0 ? (
                        <p className="empty">No messages yet.</p>
                      ) : (
                        <ul className="admin-list">
                          {threadMessages.map((m) => (
                            <li key={m.id}>
                              <span>
                                {new Date(m.sentAt).toLocaleString()}
                                {m.contactAttemptDetected ? " · contact info attempt" : ""}
                              </span>
                              <p>{m.body}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
