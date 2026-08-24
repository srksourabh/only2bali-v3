"use client";

import { useEffect, useState } from "react";

type ThreadRow = {
  id: string;
  tripRequestId: string | null;
  businessName: string | null;
  bookingId: string | null;
};

export default function ProviderMessagesPanel() {
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ id: string; body: string; sentAt: string }>>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const res = await fetch("/api/messages", { cache: "no-store" });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    setThreads(json.data.threads ?? []);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const openThread = async (id: string) => {
    setThreadId(id);
    const res = await fetch(`/api/messages?threadId=${id}`, { cache: "no-store" });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    setMessages(json.data.messages ?? []);
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
    await openThread(threadId);
  };

  return (
    <section className="acard">
      <h2>Messages</h2>
      <p className="empty">Contact details stay masked until a booking is confirmed.</p>
      {error && <p className="errmsg" role="alert">{error}</p>}
      <ul className="admin-list">
        {threads.map((t) => (
          <li key={t.id}>
            <b>{t.bookingId ? "Booking thread" : "Pre-booking thread"}</b>
            <span>{t.tripRequestId ? "trip request" : "direct"}</span>
            <button type="button" onClick={() => openThread(t.id).catch((e) => setError(e.message))}>
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
  );
}
