/**
 * Decides where to send someone after they sign in.
 *
 * Only same-origin paths are honoured. Accepting an absolute or
 * protocol-relative URL here would make the login page an open redirect — a
 * phishing gift, because the link genuinely starts on our domain.
 */
export function safeNextPath(next: string | undefined, fallback: string): string {
  if (!next) return fallback;
  // Must be rooted, and must not be protocol-relative ("//host" is off-site).
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  // A backslash is treated as a slash by some browsers, so "/\evil.com" escapes.
  if (next.includes("\\")) return fallback;
  // Reject anything carrying a scheme, however it is cased or encoded.
  const lowered = next.toLowerCase();
  if (lowered.includes(":") || lowered.includes("%2f%2f") || lowered.includes("%5c")) {
    return fallback;
  }
  return next;
}
