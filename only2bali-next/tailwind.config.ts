import type { Config } from "tailwindcss";

/**
 * Utilities only — preflight stays off so the existing brand.css layer
 * (buttons, forms, lists) is not reset. Tokens map to the emerald / saffron /
 * ivory palette already in :root, not a generic shadcn purple theme.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        border: "rgb(227 220 203 / <alpha-value>)",
        foreground: "rgb(29 42 39 / <alpha-value>)",
        primary: "rgb(14 79 68 / <alpha-value>)",
        secondary: "rgb(243 236 221 / <alpha-value>)",
        ring: "rgb(232 148 26 / <alpha-value>)",
      },
    },
  },
  plugins: [],
};

export default config;
