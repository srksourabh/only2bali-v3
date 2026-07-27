"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { wa, mailto, CFG } from "@/lib/config";
import { toProtocol } from "@/lib/validators/leads";

function InquiryComponent() {
  const [f, setF] = useState({ name: "", phone: "", city: "", size: "", food: "", when: "", msg: "" });
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    const pkg = searchParams.get("package");
    const service = searchParams.get("service");

    let initialMsg = "";
    if (service === "cook") {
      initialMsg = "Requesting accompanying Indian cook/chef services.";
    } else if (pkg) {
      initialMsg = `Interested in customizing the ${pkg} package.`;
    }

    if (initialMsg) {
      setF((s) => ({ ...s, msg: initialMsg }));
    }
  }, [searchParams]);
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

  /**
   * Store the enquiry before doing anything else.
   *
   * This form previously only opened a WhatsApp draft, so a visitor who closed
   * the tab — or a site with no WhatsApp number configured — produced a lead
   * nobody ever saw. The row in Postgres is now the record; WhatsApp is a
   * convenience on top of it.
   */
  const save = async (): Promise<boolean> => {
    setSending(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: f.name,
          mobile: f.phone,
          departureCity: f.city,
          groupSize: Number(f.size),
          protocol: toProtocol(f.food),
          protocolLabel: f.food,
          travelMonth: f.when,
          message: f.msg,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setErr(json?.error ?? "We could not save that just now. Please try again.");
        return false;
      }

      // Signed-in travellers also get a provider-board request. Anonymous
      // visitors still become leads; they can sign in later when they want bids.
      await fetch("/api/trip-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          protocol: toProtocol(f.food) ?? "vegetarian",
          groupSize: Number(f.size),
          departureCity: f.city,
          flexibleMonth: f.when,
          notes: f.msg,
          publishToProviders: true,
          budgetBasis: "unsure",
        }),
      }).catch(() => undefined);

      setSaved(true);
      setErr(null);
      return true;
    } catch {
      setErr("Network problem — your enquiry was not sent. Please try again.");
      return false;
    } finally {
      setSending(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid()) return;
    if (!(await save())) return;
    const link = wa(body());
    if (link) window.open(link, "_blank");
    setOk(true);
  };

  const sendByEmail = async () => {
    if (!valid()) return;
    if (!(await save())) return;
    const link = mailto("Group Inquiry — Only2Bali", body());
    if (link) window.location.href = link;
    setOk(true);
  };

  return (
    <main><section><div className="wrap">
      <span className="tag">Group Inquiry</span>
      <h2>Ready to plan? Tell us about your group.</h2>
      <p className="sub">Share the basics and our travel designer will call you back. Signed-in travelers can also receive provider bids inside the website before booking through Only2Bali.</p>
      <form onSubmit={submit} noValidate>
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
        <button className="btn btn-g" type="submit" disabled={sending}>
          {sending ? "Sending…" : CFG.whatsapp ? "Send Inquiry via WhatsApp" : "Send Inquiry"}
        </button>{" "}
        {CFG.email && (
          <button className="btn btn-o" type="button" onClick={sendByEmail} disabled={sending}>
            Send by Email Instead
          </button>
        )}
        {ok && (
          <div className="okbox">
            {saved && "✅ Inquiry received — we reply within 24 hours."}
            {saved && CFG.configured && " Your message is also open in WhatsApp or email; sending it is optional."}
          </div>
        )}
      </form>
    </div></section></main>
  );
}

export default function Inquiry() {
  return (
    <Suspense fallback={
      <div className="wrap" style={{ padding: "8rem 0", textAlign: "center" }}>
        <div className="ai-spinner" style={{ margin: "0 auto 1.5rem" }}></div>
        <h3>Loading Inquiry Form...</h3>
      </div>
    }>
      <InquiryComponent />
    </Suspense>
  );
}
