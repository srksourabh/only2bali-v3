import { z } from "zod";
import { SETTING_BY_KEY, SETTING_KEYS } from "@/lib/settings/catalog";

/** null = clear; string = set (blank secret = keep). Partial map of known keys only. */
export const adminSettingsPatchSchema = z.object({
  values: z
    .record(z.string(), z.union([z.string(), z.null()]))
    .superRefine((values, ctx) => {
      for (const key of Object.keys(values)) {
        if (!SETTING_BY_KEY[key]) {
          ctx.addIssue({
            code: "custom",
            message: `Unknown setting key: ${key}`,
            path: [key],
          });
        }
      }
    }),
});

export type AdminSettingsPatchInput = z.infer<typeof adminSettingsPatchSchema>;

export const KNOWN_SETTING_KEYS = SETTING_KEYS;
