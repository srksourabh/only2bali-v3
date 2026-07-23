"use client";
import { useState } from "react";
import { wa, CFG } from "@/lib/config";

const TYPES = ["Vegetarian restaurant","Vegan café","Jain-capable kitchen","Villa with kitchen","Hotel with veg meal support","Transport provider","Guide (Indian language)","Chef / cook","Activity partner"];
const CAPS = ["Vegetarian", "Jain", "Vegan", "Kitchen available"];

export default function Vendors() {
  const [f, setF] = useState({ name: "", type: "", loc: "", cuisine: "", langs: "", price: "", phone: "", email: "", avail: "", notes: "" });
  const [caps, setCaps] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [sending, setSending] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  /**
   * The application is stored before WhatsApp is opened. Onboarding a provider
   * is the whole point of the marketplace; losing the submission because the
   * visitor never sent the draft is not acceptable.
   */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name || !f.type || !f.loc || !f.phone || caps.length === 0) {
      setErr("Please complete: name, business type, location, WhatsApp/phone, and at least one dietary capability."); return;
    }
    if (f.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) { setErr("Please enter a valid email address (or leave it blank)."); return; }
    setErr(null);

    setSending(true);
    try {
      const res = await fetch("/api/vendor-applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessName: f.name,
          businessType: f.type,
          baseArea: f.loc,
          cuisine: f.cuisine,
          capabilities: caps,
          languages: f.langs,
          priceBand: f.price,
          whatsapp: f.phone,
          email: f.email,
          availability: f.avail,
          notes: f.notes,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setErr(json?.error ?? "We could not save that just now. Please try again.");
        return;
      }
    } catch {
      setErr("Network problem — your application was not sent. Please try again.");
      return;
    } finally {
      setSending(false);
    }

    const body = `VENDOR APPLICATION — Only2Bali\n• Business: ${f.name}\n• Type: ${f.type}\n• Location/areas: ${f.loc}${f.cuisine ? `\n• Cuisine/service: ${f.cuisine}` : ""}\n• Capability: ${caps.join(", ")}${f.langs ? `\n• Languages: ${f.langs}` : ""}${f.price ? `\n• Pricing band: ${f.price}` : ""}\n• Phone/WA: ${f.phone}${f.email ? `\n• Email: ${f.email}` : ""}${f.avail ? `\n• Availability: ${f.avail}` : ""}${f.notes ? `\n• Notes: ${f.notes}` : ""}`;
    const link = wa(body);
    if (link) window.open(link, "_blank");
    setOk(true);
  };

  return (
    <main><section><div className="wrap">
      <span className="tag">Bali Vendor Onboarding</span>
      <h2>Run a veg-friendly business in Bali? Join the network.</h2>
      <p className="sub">We onboard vegetarian restaurants, vegan cafés, Jain-capable kitchens, villas with kitchens, veg-supportive hotels, transport providers, Indian-language guides, chefs and activity partners.</p>
      <form onSubmit={submit} noValidate className="card">
        <div className="row">
          <div><label htmlFor="vn">Business / your name *</label><input id="vn" value={f.name} onChange={set("name")} required /></div>
          <div><label htmlFor="vt">Business type *</label>
            <select id="vt" value={f.type} onChange={set("type")} required>
              <option value="">Select…</option>{TYPES.map((t) => <option key={t}>{t}</option>)}
            </select></div>
        </div>
        <div className="row">
          <div><label htmlFor="vl">Location / service areas *</label><input id="vl" value={f.loc} onChange={set("loc")} placeholder="Ubud, Seminyak…" required /></div>
          <div><label htmlFor="vc">Cuisine / service type</label><input id="vc" value={f.cuisine} onChange={set("cuisine")} /></div>
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label>Dietary capability *</label>
          <div className="checks">
            {CAPS.map((c) => (
              <label key={c}><input type="checkbox" checked={caps.includes(c)}
                onChange={(e) => setCaps(e.target.checked ? [...caps, c] : caps.filter((x) => x !== c))} /> {c}</label>
            ))}
          </div>
        </div>
        <div className="row">
          <div><label htmlFor="vg">Languages spoken</label><input id="vg" value={f.langs} onChange={set("langs")} placeholder="English, Hindi, Bahasa…" /></div>
          <div><label htmlFor="vp">Pricing band</label>
            <select id="vp" value={f.price} onChange={set("price")}>
              <option value="">Select…</option><option>Budget</option><option>Mid-range</option><option>Premium</option>
            </select></div>
        </div>
        <div className="row">
          <div><label htmlFor="vph">WhatsApp / phone *</label><input id="vph" type="tel" value={f.phone} onChange={set("phone")} placeholder="+62…" required /></div>
          <div><label htmlFor="ve">Email</label><input id="ve" type="email" value={f.email} onChange={set("email")} /></div>
        </div>
        <div className="row">
          <div><label htmlFor="va">Availability</label><input id="va" value={f.avail} onChange={set("avail")} /></div>
          <div><label htmlFor="vno">Special notes</label><input id="vno" value={f.notes} onChange={set("notes")} /></div>
        </div>
        {err && <p className="errmsg" role="alert">{err}</p>}
        <button className="btn btn-p" type="submit" disabled={sending}>
          {sending ? "Sending…" : "Apply to Join"}
        </button>
        <p className="fineprint">
          {CFG.whatsapp
            ? "Your application is recorded when you submit, and WhatsApp opens with a copy so you can add anything else."
            : "Your application is recorded when you submit."}
        </p>
        {ok && <div className="okbox">✅ Application received. We typically respond within 2 business days.</div>}
      </form>
    </div></section></main>
  );
}
