"use client";
import { useState } from "react";
import { wa, mailto } from "@/lib/config";

export default function Inquiry() {
  const [f, setF] = useState({ name: "", phone: "", city: "", size: "", food: "", when: "", msg: "" });
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const body = () =>
    `GROUP INQUIRY — Only2Bali\n• Name: ${f.name}\n• WhatsApp: ${f.phone}\n• Departure city: ${f.city}\n• Group size: ${f.size}\n• Food protocol: ${f.food}${f.when ? `\n• Travel month: ${f.when}` : ""}${f.msg ? `\n• Notes: ${f.msg}` : ""}`;

  const valid = () => {
    if (!f.name || !f.phone || !f.city || !f.size || !f.food) {
      setErr("Please complete name, WhatsApp number, departure city, group size and food protocol."); return false;
    }
    if (!/^[+\d][\d\s-]{7,}$/.test(f.phone.trim())) { setErr("Please enter a valid phone number (e.g. +91 98xxxxxxx)."); return false; }
    setErr(null); return true;
  };

  return (
    <main><section><div className="wrap">
      <span className="tag">Group Inquiry</span>
      <h2>Ready to plan? Tell us about your group.</h2>
      <p className="sub">Share the basics and our travel designer will call you back with a customized plan — no payment, no obligation.</p>
      <form onSubmit={(e) => { e.preventDefault(); if (valid()) { window.open(wa(body()), "_blank"); setOk(true); } }} noValidate>
        <div className="row">
          <div><label htmlFor="ln">Your name *</label><input id="ln" value={f.name} onChange={set("name")} required /></div>
          <div><label htmlFor="lp">WhatsApp number *</label><input id="lp" type="tel" value={f.phone} onChange={set("phone")} placeholder="+91…" required /></div>
        </div>
        <div className="row">
          <div><label htmlFor="lc">Departure city *</label><input id="lc" value={f.city} onChange={set("city")} required /></div>
          <div><label htmlFor="ls">Group size *</label><input id="ls" type="number" min={2} value={f.size} onChange={set("size")} required /></div>
        </div>
        <div className="row">
          <div><label htmlFor="lf">Food protocol *</label>
            <select id="lf" value={f.food} onChange={set("food")} required>
              <option value="">Select…</option><option>Jain</option><option>Vegetarian</option><option>Vegan</option><option>Mixed (veg household)</option>
            </select></div>
          <div><label htmlFor="lw">Tentative travel month</label><input id="lw" value={f.when} onChange={set("when")} placeholder="e.g. October 2026" /></div>
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="lm">Anything else?</label>
          <textarea id="lm" rows={3} value={f.msg} onChange={set("msg")} placeholder="Cook needed, kitchen stay, temple visits, special occasions…" />
        </div>
        {err && <p className="errmsg" role="alert">{err}</p>}
        <button className="btn btn-g" type="submit">Send Inquiry via WhatsApp</button>{" "}
        <button className="btn btn-o" type="button" onClick={() => { if (valid()) { window.location.href = mailto("Group Inquiry — Only2Bali", body()); setOk(true); } }}>
          Send by Email Instead
        </button>
        {ok && <div className="okbox">✅ Inquiry prepared! Complete sending it — we reply within 24 hours.</div>}
      </form>
    </div></section></main>
  );
}
