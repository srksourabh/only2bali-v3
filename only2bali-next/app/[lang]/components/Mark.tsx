/**
 * Candi bentar — the Balinese split gate. Inline rather than an <img> so it can
 * inherit colour and stay crisp at any size. Geometry is symmetric about x=32;
 * mirror both pylons together or not at all.
 */
export default function Mark({
  size = 30,
  reversed = false,
  title,
}: {
  size?: number;
  reversed?: boolean;
  title?: string;
}) {
  const stone = reversed ? "#faf6ee" : "var(--emerald, #0e4f44)";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <circle cx="32" cy="17" r="4" fill="var(--saffron, #e8941a)" />
      <path fill={stone} d="M27 60H10v-3h2V46h3V34h3V22h3V10h6z" />
      <path fill={stone} d="M37 60h17v-3h-2V46h-3V34h-3V22h-3V10h-6z" />
    </svg>
  );
}
