import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { locales } from "@/lib/i18n/config";

describe("public search metadata", () => {
  it("publishes every public route and package for every locale", () => {
    const entries = sitemap();
    const expectedRoutesPerLocale = 13 + 3;

    expect(entries).toHaveLength(locales.length * expectedRoutesPerLocale);
    expect(entries.map((entry) => entry.url)).toContain("https://only2bali.com/en");
    expect(entries.map((entry) => entry.url)).toContain(
      "https://only2bali.com/hi/packages/sattvik-serenity",
    );
    expect(entries.map((entry) => entry.url)).toContain("https://only2bali.com/en/packages");
    expect(entries.map((entry) => entry.url)).toContain("https://only2bali.com/en/providers");
  });

  it("keeps private and API routes out of search results", () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
    const disallowed = rules.flatMap((rule) => rule.disallow ?? []);

    expect(config.sitemap).toBe("https://only2bali.com/sitemap.xml");
    expect(disallowed).toEqual(
      expect.arrayContaining(["/api/", "/*/account", "/*/admin", "/*/provider"]),
    );
  });
});
