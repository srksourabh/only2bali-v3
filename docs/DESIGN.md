# Design system - Only2Bali v3.0

> The real design language, extracted from the codebase on 2026-07-16.
> Source of truth: `only2bali-site/index.html` - the Next.js README calls it the
> pixel-complete design benchmark for the rebuild.

## Brand

Warm, premium, and unmistakably Indian-facing-Bali. Deep emerald as the anchor, saffron
as the accent, ivory as the ground. The palette reads as temple and spice rather than
tropical beach.

## Colour tokens

Defined as CSS custom properties in `only2bali-site/index.html`. Use these names.

| Token | Value | Use |
|---|---|---|
| `--emerald` | `#0e4f44` | Primary. Headers, nav, primary buttons. |
| `--emerald-d` | `#093830` | Primary hover / pressed. |
| `--saffron` | `#e8941a` | Accent. CTAs, highlights, active states. |
| `--saffron-d` | `#c97a0a` | Accent hover / pressed. |
| `--ivory` | `#faf6ee` | Page background. |
| `--cream` | `#f3ecdd` | Raised surfaces, cards, alternating sections. |
| `--ink` | `#1d2a27` | Body text. |
| `--muted` | `#5d6f6a` | Secondary text, captions, help text. |
| `--line` | `#e3dccb` | Borders, dividers, input outlines. |
| `--ok` | `#1e7d4f` | Success. |
| `--err` | `#c0392b` | Error, destructive. |

**Contrast**: `--ink` on `--ivory` and white on `--emerald` both clear WCAG AA.
`--saffron` on `--ivory` does **not** meet AA for body text - use it for large text,
fills, and borders only, never small copy.

## Typography

| Role | Font | Loaded as |
|---|---|---|
| Display | **Fraunces** | `next/font/google`, variable `--font-display` |
| Body | **Inter** | `next/font/google`, variable `--font-body` |

Weights in use: Fraunces 500 / 600 / 700 (optical size 9–144), Inter 400 / 500 / 600 / 700.

In Next.js both are wired in `app/layout.tsx` and exposed as CSS variables on `<body>`.
Reference them as `var(--font-display)` / `var(--font-body)` - do not re-import the
fonts per component, and do not add a third typeface.

## Shape and depth

| Token | Value |
|---|---|
| `--r` | `14px` - the standard corner radius. Used almost everywhere. |
| `--shadow` | `0 10px 30px rgba(14,79,68,.10)` - a soft emerald-tinted lift, not a grey drop shadow. |

The tinted shadow is deliberate and part of the brand. Do not substitute a neutral
`rgba(0,0,0,…)` shadow.

## Per-app reality

The design language is **not** applied consistently across the four apps. Know where
you are:

| App | Styling | State |
|---|---|---|
| `only2bali-site/` | Inline `<style>`, CSS custom properties | **The benchmark.** Cleanest expression of the brand. |
| `only2bali-next/` | Global CSS + `planner.css`, `next/font` | Follows the benchmark. **Build new work here.** |
| `Frontend/` | Bootstrap 5.3 + ~30 hand-written CSS files | Legacy. Bootstrap defaults leak through. Do not invest. |

Notable legacy problems in `Frontend/`, listed so nobody mistakes them for the pattern:
- `import "bootstrap/dist/css/bootstrap.min.css"` is repeated inside individual page
  components rather than once at the entry point
- One `.css` file per component, largely unshared, with no tokens
- `GlobalLoader.js` shows a fake 1-second spinner on every route change

## Conventions for new work

1. **Build in `only2bali-next/`.** New UI belongs there, not in the React app.
2. **Use the tokens.** No raw hex in components. If a colour is missing, add a token.
3. **Server components by default.** Only reach for `"use client"` when you need state,
   effects, or event handlers.
4. **Respect the performance budget.** `AGENTS.md` sets ≤ 170 KB gzipped JS per route.
   That budget is why this project left Create React App - do not quietly spend it on a
   component library.
5. **Skeletons, not spinners.** `AGENTS.md` mandates skeleton states for async regions.
   The legacy fake loader is an anti-pattern, not a precedent.
6. **Icons**: `lucide-react` is already a dependency in both frontends. Use it.

## Iconography and imagery

- Icons: `lucide-react` (both apps), plus `react-icons` in the legacy app
- Assets live in `only2bali-next/public/Asset/` and are byte-for-byte duplicated in
  `Frontend/src/Asset/`. **When you change an image, remember both copies exist.**
- The logo is `bali loogoo.svg` - note the misspelling is real and is in the path
- A custom cursor trail is part of the brand: `CustomCursor.tsx` in Next.js, ported from
  the p5-based `StopMotionCursor.js` in the React app

## Not in scope

This project does **not** currently have: a dark mode, a component library, design
tokens in a shared package, or Tailwind. Do not add any of them without an ADR - the
Bootstrap-vs-custom-CSS split is already one inconsistency too many.
