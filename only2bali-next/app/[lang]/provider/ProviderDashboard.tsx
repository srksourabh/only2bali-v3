"use client";

import { useEffect, useState } from "react";
import ReviewForm from "../account/ReviewForm";
import ProviderBoardPanel from "./ProviderBoardPanel";

type ApiState = "idle" | "saving" | "saved" | "error";

interface Catalog {
  provider: { businessName: string; baseArea: string | null; description: string | null };
  listings: Array<{ id: string; title: string; serviceType: string; priceAmount: number; status: string }>;
  media: Array<{ id: string; fileUrl: string; kind: string; approved: boolean }>;
  events: Array<{ id: string; title: string; startsAt: string; status: string }>;
  promotions: Array<{ id: string; title: string; status: string }>;
  payoutAccount: { status: string; currency: string; maskedAccount: string | null } | null;
}

interface ProviderBooking {
  bookingId: string;
  reference: string;
  status: string;
  grossAmount: number;
  netAmount: number | null;
  currency: string;
  pax: number;
  packageName: string | null;
  listingTitle: string | null;
  travellerName: string | null;
  serviceDate: string | null;
}

interface ProviderDocument {
  id: string;
  kind: string;
  fileUrl: string;
  status: string;
}

async function postJson(path: string, method: "POST" | "PUT" | "PATCH", body: unknown) {
  const res = await fetch(path, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) throw new Error(json?.error ?? "Request failed.");
  return json.data;
}

async function uploadFile(file: File, folder: "media" | "documents") {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  const res = await fetch("/api/provider/uploads", { method: "POST", body: form });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) throw new Error(json?.error ?? "Upload failed.");
  return json.data.upload as { url?: string; ref?: string; handle?: string; access?: string };
}

export default function ProviderDashboard() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [bookings, setBookings] = useState<ProviderBooking[]>([]);
  const [documents, setDocuments] = useState<ProviderDocument[]>([]);
  const [state, setState] = useState<ApiState>("idle");
  const [error, setError] = useState("");
  const [profile, setProfile] = useState({ businessName: "", baseArea: "", description: "", addressLine1: "", city: "", whatsapp: "" });
  const [listing, setListing] = useState({ title: "", serviceType: "transport", area: "", priceAmount: "", tier: "comfort", description: "" });
  const [media, setMedia] = useState({ fileUrl: "", kind: "photo", caption: "" });
  const [docKind, setDocKind] = useState("business_licence");
  const [event, setEvent] = useState({ title: "", startsAt: "", area: "", priceAmount: "", description: "" });
  const [promotion, setPromotion] = useState({ title: "", priceAmount: "", validUntil: "", description: "" });
  const [payout, setPayout] = useState({ accountHolderName: "", bankName: "", currency: "IDR", maskedAccount: "", upiId: "" });

  const load = async () => {
    const [catalogRes, bookingsRes, docsRes] = await Promise.all([
      fetch("/api/provider/catalog", { cache: "no-store" }),
      fetch("/api/provider/bookings", { cache: "no-store" }),
      fetch("/api/provider/documents", { cache: "no-store" }),
    ]);
    const catalogJson = await catalogRes.json();
    if (!catalogJson.success) throw new Error(catalogJson.error);
    setCatalog(catalogJson.data);
    setProfile({
      businessName: catalogJson.data.provider.businessName ?? "",
      baseArea: catalogJson.data.provider.baseArea ?? "",
      description: catalogJson.data.provider.description ?? "",
      addressLine1: catalogJson.data.provider.addressLine1 ?? "",
      city: catalogJson.data.provider.city ?? "",
      whatsapp: catalogJson.data.provider.whatsapp ?? "",
    });

    const bookingsJson = await bookingsRes.json();
    if (bookingsJson.success) setBookings(bookingsJson.data.bookings ?? []);

    const docsJson = await docsRes.json();
    if (docsJson.success) setDocuments(docsJson.data.documents ?? []);
  };

  useEffect(() => {
    load().catch((err) => {
      setError(err.message);
      setState("error");
    });
  }, []);

  const run = async (fn: () => Promise<void>) => {
    setState("saving");
    setError("");
    try {
      await fn();
      await load();
      setState("saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("error");
    }
  };

  return (
    <main className="accountpage">
      <div className="o2b-wrap">
        <header className="accounthead">
          <div>
            <span className="eyebrow">Provider workspace</span>
            <h1>Manage services, offers and payout details</h1>
            <p className="empty">Traveler payments are collected in INR. Provider payout records track the settlement currency, normally IDR.</p>
          </div>
        </header>

        {state === "error" && <p className="errmsg" role="alert">{error}</p>}
        {state === "saved" && <p className="okbox">Saved. Changes that affect travelers are pending review before publishing.</p>}

        <div className="accountgrid">
          <ProviderBoardPanel />
          <section className="acard">
            <h2>Incoming bookings</h2>
            <p className="empty">{bookings.length} bookings assigned to your services.</p>
            <ul className="admin-list">
              {bookings.slice(0, 12).map((b) => (
                <li key={b.bookingId}>
                  <b>{b.listingTitle ?? b.packageName ?? b.reference}</b>
                  <span>
                    {b.reference} · {b.status} · {b.pax} pax
                    {b.serviceDate ? ` · ${b.serviceDate}` : ""}
                    {b.travellerName ? ` · ${b.travellerName}` : ""}
                  </span>
                  <div className="mini-actions">
                    {b.status === "confirmed" && (
                      <button
                        type="button"
                        onClick={() =>
                          run(() =>
                            postJson(`/api/provider/bookings/${b.bookingId}`, "PATCH", {
                              status: "in_progress",
                            }).then(() => undefined)
                          )
                        }
                      >
                        Start fulfilment
                      </button>
                    )}
                    {(b.status === "confirmed" || b.status === "in_progress") && (
                      <button
                        type="button"
                        onClick={() =>
                          run(() =>
                            postJson(`/api/provider/bookings/${b.bookingId}`, "PATCH", {
                              status: "completed",
                            }).then(() => undefined)
                          )
                        }
                      >
                        Mark completed
                      </button>
                    )}
                  </div>
                  {(b.status === "confirmed" || b.status === "completed" || b.status === "in_progress") && (
                    <ReviewForm
                      bookingId={b.bookingId}
                      direction="vendor_to_traveller"
                      copy={{
                        heading: "Leave a rating",
                        submit: "Submit rating",
                        thanks: "Thank you — your rating is saved.",
                        prompt: "Rate this traveller",
                      }}
                    />
                  )}
                </li>
              ))}
            </ul>
          </section>
          <section className="acard">
            <h2>Business profile</h2>
            <label>Business name</label>
            <input value={profile.businessName} onChange={(e) => setProfile({ ...profile, businessName: e.target.value })} />
            <label>Service area</label>
            <input value={profile.baseArea} onChange={(e) => setProfile({ ...profile, baseArea: e.target.value })} />
            <label>Address</label>
            <input value={profile.addressLine1} onChange={(e) => setProfile({ ...profile, addressLine1: e.target.value })} />
            <label>City</label>
            <input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
            <label>WhatsApp</label>
            <input value={profile.whatsapp} onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })} />
            <label>Description</label>
            <textarea rows={3} value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} />
            <button className="btn btn-solid btn-sm" disabled={state === "saving"} onClick={() => run(() => postJson("/api/provider/profile", "PUT", profile).then(() => undefined))}>
              Save profile
            </button>
          </section>

          <section className="acard">
            <h2>Add service</h2>
            <label>Title</label>
            <input value={listing.title} onChange={(e) => setListing({ ...listing, title: e.target.value })} placeholder="Luxury car with driver" />
            <label>Type</label>
            <select value={listing.serviceType} onChange={(e) => setListing({ ...listing, serviceType: e.target.value })}>
              <option value="restaurant">Restaurant</option>
              <option value="accommodation">Stay</option>
              <option value="transport">Transport</option>
              <option value="guide">Guide</option>
              <option value="cook">Cook</option>
              <option value="activity_operator">Activity</option>
              <option value="tour_agency">Tour agency</option>
            </select>
            <label>Area</label>
            <input value={listing.area} onChange={(e) => setListing({ ...listing, area: e.target.value })} />
            <label>INR price in paise</label>
            <input value={listing.priceAmount} onChange={(e) => setListing({ ...listing, priceAmount: e.target.value })} placeholder="750000 for Rs 7,500" />
            <label>Budget tier</label>
            <select value={listing.tier} onChange={(e) => setListing({ ...listing, tier: e.target.value })}>
              <option value="economical">Economical</option>
              <option value="comfort">Comfort</option>
              <option value="premium">Premium</option>
            </select>
            <label>Description</label>
            <textarea rows={3} value={listing.description} onChange={(e) => setListing({ ...listing, description: e.target.value })} />
            <button className="btn btn-solid btn-sm" disabled={state === "saving"} onClick={() => run(async () => {
              await postJson("/api/provider/listings", "POST", {
                ...listing,
                priceAmount: Number(listing.priceAmount),
                capacityMin: 1,
                capacityMax: 30,
                priceCurrency: "INR",
                priceUnit: "per_trip",
              });
              setListing({ title: "", serviceType: "transport", area: "", priceAmount: "", tier: "comfort", description: "" });
            })}>
              Add service
            </button>
          </section>

          <section className="acard">
            <h2>Photos</h2>
            <label>Upload photo</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={state === "saving"}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                run(async () => {
                  const uploaded = await uploadFile(file, "media");
                  await postJson("/api/provider/media", "POST", {
                    fileUrl: uploaded.url,
                    kind: media.kind,
                    caption: media.caption,
                  });
                  setMedia({ fileUrl: "", kind: "photo", caption: "" });
                });
              }}
            />
            <label>Kind</label>
            <select value={media.kind} onChange={(e) => setMedia({ ...media, kind: e.target.value })}>
              <option value="photo">Photo</option>
              <option value="cover">Cover</option>
              <option value="menu">Menu</option>
              <option value="gallery">Gallery</option>
            </select>
            <label>Caption</label>
            <input value={media.caption} onChange={(e) => setMedia({ ...media, caption: e.target.value })} />
            <label>Or paste https URL</label>
            <input value={media.fileUrl} onChange={(e) => setMedia({ ...media, fileUrl: e.target.value })} placeholder="https://..." />
            <button className="btn btn-ghost btn-sm" disabled={state === "saving" || !media.fileUrl} onClick={() => run(async () => {
              await postJson("/api/provider/media", "POST", media);
              setMedia({ fileUrl: "", kind: "photo", caption: "" });
            })}>
              Add from URL
            </button>
          </section>

          <section className="acard">
            <h2>KYC documents</h2>
            <p className="empty">Upload a licence, tax ID, insurance or ID for admin review.</p>
            <label>Document type</label>
            <select value={docKind} onChange={(e) => setDocKind(e.target.value)}>
              <option value="business_licence">Business licence</option>
              <option value="tax_id">Tax ID</option>
              <option value="insurance">Insurance</option>
              <option value="photo_id">Photo ID</option>
              <option value="kitchen_certificate">Kitchen certificate</option>
            </select>
            <label>Upload file (JPEG, PNG, WebP or PDF)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              disabled={state === "saving"}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                run(async () => {
                  const uploaded = await uploadFile(file, "documents");
                  if (!uploaded.ref || !uploaded.handle) throw new Error("Upload did not return a document handle.");
                  await postJson("/api/provider/documents", "POST", {
                    kind: docKind,
                    ref: uploaded.ref,
                    handle: uploaded.handle,
                  });
                });
              }}
            />
            <ul className="admin-list">
              {documents.slice(0, 8).map((d) => (
                <li key={d.id}>
                  <b>{d.kind.replaceAll("_", " ")}</b>
                  <span>{d.status}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="acard">
            <h2>Events and offers</h2>
            <label>Event title</label>
            <input value={event.title} onChange={(e) => setEvent({ ...event, title: e.target.value })} />
            <label>Event start</label>
            <input type="datetime-local" value={event.startsAt} onChange={(e) => setEvent({ ...event, startsAt: e.target.value })} />
            <label>Area</label>
            <input value={event.area} onChange={(e) => setEvent({ ...event, area: e.target.value })} />
            <button className="btn btn-ghost btn-sm" disabled={state === "saving"} onClick={() => run(async () => {
              await postJson("/api/provider/events", "POST", {
                ...event,
                startsAt: new Date(event.startsAt).toISOString(),
                priceAmount: event.priceAmount ? Number(event.priceAmount) : undefined,
              });
              setEvent({ title: "", startsAt: "", area: "", priceAmount: "", description: "" });
            })}>
              Add event
            </button>

            <label>Offer title</label>
            <input value={promotion.title} onChange={(e) => setPromotion({ ...promotion, title: e.target.value })} />
            <label>Offer INR price in paise</label>
            <input value={promotion.priceAmount} onChange={(e) => setPromotion({ ...promotion, priceAmount: e.target.value })} />
            <button className="btn btn-solid btn-sm" disabled={state === "saving"} onClick={() => run(async () => {
              await postJson("/api/provider/promotions", "POST", {
                ...promotion,
                priceAmount: promotion.priceAmount ? Number(promotion.priceAmount) : undefined,
                validUntil: promotion.validUntil ? new Date(promotion.validUntil).toISOString() : undefined,
              });
              setPromotion({ title: "", priceAmount: "", validUntil: "", description: "" });
            })}>
              Add offer
            </button>
          </section>

          <section className="acard">
            <h2>Payout details</h2>
            <label>Account holder</label>
            <input value={payout.accountHolderName} onChange={(e) => setPayout({ ...payout, accountHolderName: e.target.value })} />
            <label>Bank name</label>
            <input value={payout.bankName} onChange={(e) => setPayout({ ...payout, bankName: e.target.value })} />
            <label>Settlement currency</label>
            <select value={payout.currency} onChange={(e) => setPayout({ ...payout, currency: e.target.value })}>
              <option value="IDR">IDR</option>
              <option value="INR">INR</option>
            </select>
            <label>Masked account or UPI</label>
            <input value={payout.maskedAccount} onChange={(e) => setPayout({ ...payout, maskedAccount: e.target.value })} placeholder="Only masked details, not full account number" />
            <input value={payout.upiId} onChange={(e) => setPayout({ ...payout, upiId: e.target.value })} placeholder="UPI ID if applicable" />
            <button className="btn btn-solid btn-sm" disabled={state === "saving"} onClick={() => run(() => postJson("/api/provider/payout-account", "PUT", payout).then(() => undefined))}>
              Save payout details
            </button>
          </section>

          <section className="acard">
            <h2>Current catalog</h2>
            <p className="empty">{catalog?.listings.length ?? 0} services, {catalog?.media.length ?? 0} photos, {catalog?.events.length ?? 0} events, {catalog?.promotions.length ?? 0} offers.</p>
            <p className="empty">Payout status: {catalog?.payoutAccount?.status ?? "not submitted"}</p>
            <ul className="why">
              {catalog?.listings.slice(0, 5).map((item) => (
                <li key={item.id}><span>{item.title} - {item.status}</span></li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
