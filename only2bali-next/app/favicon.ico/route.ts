const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0f4d3a"/>
  <path d="M32 8c9 8 15 18 15 29 0 11-7 19-15 19S17 48 17 37C17 26 23 16 32 8Z" fill="#f5c04f"/>
  <path d="M24 38c5-1 11-1 16 0-1 5-4 9-8 9s-7-4-8-9Z" fill="#fff8e6"/>
</svg>`;

export function GET() {
  return new Response(icon, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
