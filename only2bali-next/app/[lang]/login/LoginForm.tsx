"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

type Channel = "email" | "mobile";
type Step = "password" | "identifier" | "code";
type Role = "traveller" | "vendor" | "admin";
type Mode = "signin" | "signup";

const RESEND_COOLDOWN_SECONDS = 60;

export default function LoginForm({
  dict,
  lang,
  next,
}: {
  dict: Dictionary;
  lang: Locale;
  next: string;
}) {
  const t = dict.auth;
  const router = useRouter();

  const [role, setRole] = useState<Role>("traveller");
  const [mode, setMode] = useState<Mode>("signin");
  const [step, setStep] = useState<Step>("password");
  const [channel, setChannel] = useState<Channel>("email");
  const [contact, setContact] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const codeRef = useRef<HTMLInputElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);

  // Move focus to whichever field the reader now has to fill.
  useEffect(() => {
    if (step !== "password") (step === "code" ? codeRef : contactRef).current?.focus();
  }, [step]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const payload = useCallback(
    () => (channel === "email" ? { email: contact } : { mobile: contact }),
    [channel, contact]
  );

  async function passwordAuth(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(mode === "signup" ? "/api/auth/password/signup" : "/api/auth/password/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          role,
          email,
          businessName,
        }),
      });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        router.push(role === "vendor" ? `/${lang}/provider` : role === "admin" ? `/${lang}/admin` : next);
        router.refresh();
        return;
      }
      setError(body?.fields?.[0]?.message ?? body?.error ?? t.errGeneric);
    } catch {
      setError(t.errNetwork);
    } finally {
      setBusy(false);
    }
  }

  const googleHref = `/api/auth/google/start?role=${role}&next=${encodeURIComponent(role === "vendor" ? `/${lang}/provider` : next)}`;

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });
      const body = await res.json().catch(() => null);

      if (res.status === 429) {
        setError(t.errRate);
      } else if (!res.ok) {
        setError(body?.fields?.[0]?.message ?? body?.error ?? t.errGeneric);
      } else {
        setStep("code");
        setCode("");
        setCooldown(RESEND_COOLDOWN_SECONDS);
      }
    } catch {
      setError(t.errNetwork);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload(), code }),
      });
      const body = await res.json().catch(() => null);

      if (res.ok) {
        // The session cookie is httpOnly, so the server has to re-read it.
        router.push(next);
        router.refresh();
        return;
      }

      setError(
        body?.reason === "locked" ? t.errLocked
        : body?.reason === "invalid" ? t.errInvalid
        : body?.reason === "expired" || body?.reason === "no_code" ? t.errExpired
        : body?.error ?? t.errGeneric
      );
      setCode("");
      codeRef.current?.focus();
    } catch {
      setError(t.errNetwork);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="authcard">
      <div className="rolegrid" role="tablist" aria-label="Login type">
        {(["traveller", "vendor", "admin"] as const).map((r) => (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={role === r}
            onClick={() => {
              setRole(r);
              setMode("signin");
              setError(null);
            }}
          >
            {r === "traveller" ? "Traveler" : r === "vendor" ? "Service provider" : "Admin"}
          </button>
        ))}
      </div>

      {step === "password" ? (
        <form onSubmit={passwordAuth} noValidate>
          <h1>
            {role === "admin"
              ? "Admin control login"
              : mode === "signup"
                ? `Create ${role === "vendor" ? "provider" : "traveler"} account`
                : `Sign in as ${role === "vendor" ? "provider" : "traveler"}`}
          </h1>
          <p className="authsub">
            {role === "admin"
              ? "Admin accounts are created by the platform owner only. This login controls provider approvals, rates, images, events and discounts."
              : "Use username and password, or continue with Google. Your session stays in a secure HTTP-only cookie."}
          </p>

          {role !== "admin" && (
            <div className="authtabs" role="tablist" aria-label="Account action">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                >
                  {m === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>
          )}

          {role !== "admin" && (
            <a className="googlebtn" href={googleHref}>
              <span aria-hidden="true">G</span>
              Continue with Google
            </a>
          )}

          <label htmlFor="username">Username</label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            aria-invalid={Boolean(error)}
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            aria-invalid={Boolean(error)}
          />

          {mode === "signup" && role !== "admin" && (
            <>
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </>
          )}

          {mode === "signup" && role === "vendor" && (
            <>
              <label htmlFor="businessName">Business name</label>
              <input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
            </>
          )}

          {error && (
            <p className="autherr" id="auth-error" role="alert">
              {error}
            </p>
          )}

          <button className="btn btn-primary authsubmit" type="submit" disabled={busy || !username || !password}>
            {busy ? "Checking..." : mode === "signup" ? "Create account" : "Sign in"}
          </button>

          {role !== "admin" && (
            <div className="authalt">
              <button type="button" onClick={() => setStep("identifier")}>
                Use OTP instead
              </button>
            </div>
          )}
        </form>
      ) : step === "identifier" ? (
        <form onSubmit={send} noValidate>
          <h1>{t.heading}</h1>
          <p className="authsub">{t.sub}</p>

          <div className="authtabs" role="tablist" aria-label={t.signIn}>
            {(["email", "mobile"] as const).map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={channel === c}
                onClick={() => {
                  setChannel(c);
                  setContact("");
                  setError(null);
                }}
              >
                {c === "email" ? t.useEmail : t.useMobile}
              </button>
            ))}
          </div>

          <label htmlFor="contact">
            {channel === "email" ? t.emailLabel : t.mobileLabel}
          </label>
          <input
            id="contact"
            ref={contactRef}
            type={channel === "email" ? "email" : "tel"}
            inputMode={channel === "email" ? "email" : "tel"}
            autoComplete={channel === "email" ? "email" : "tel"}
            placeholder={channel === "email" ? t.emailPlaceholder : t.mobilePlaceholder}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "auth-error" : undefined}
          />

          {error && (
            <p className="autherr" id="auth-error" role="alert">
              {error}
            </p>
          )}

          <button className="btn btn-primary authsubmit" type="submit" disabled={busy || !contact}>
            {busy ? t.sending : t.continue}
          </button>
          <div className="authalt">
            <button type="button" onClick={() => setStep("password")}>
              Use username and password
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={verify} noValidate>
          <h1>{t.codeHeading}</h1>
          <p className="authsub">
            {t.codeSentTo} <b dir="ltr">{contact}</b>. {t.expiresNote}
          </p>

          <label htmlFor="code">{t.codeLabel}</label>
          <input
            id="code"
            ref={codeRef}
            className="codeinput"
            type="text"
            inputMode="numeric"
            // Lets phones offer the code straight from the SMS.
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "auth-error" : undefined}
          />

          {error && (
            <p className="autherr" id="auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="btn btn-primary authsubmit"
            type="submit"
            disabled={busy || code.length !== 6}
          >
            {busy ? t.verifying : t.verify}
          </button>

          <div className="authalt">
            <button type="button" onClick={() => send()} disabled={busy || cooldown > 0}>
              {cooldown > 0 ? `${t.resendIn} ${cooldown}${t.seconds}` : t.resend}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("identifier");
                setCode("");
                setError(null);
              }}
            >
              {t.changeContact}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
