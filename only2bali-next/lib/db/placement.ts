import { resolveDatabaseUrl } from "./index";

/**
 * Where the database is, and where the code asking it questions is.
 *
 * Neon hostnames carry their region: `ep-name-1234.ap-southeast-1.aws.neon.tech`.
 * Vercel gives the executing function's region in `VERCEL_REGION`. Neither is a
 * credential and neither is guessable from the outside, which is the point —
 * production spent a long time being slow for a reason nobody could see from
 * either the code or the dashboard.
 *
 * The hostname itself is never reported, only the region token.
 */

export type Placement = {
  database: string | null;
  function: string | null;
  colocated: boolean | null;
};

/** Vercel region codes to the cloud region they sit in. */
const VERCEL_REGION_TO_CLOUD: Record<string, string> = {
  arn1: "eu-north-1",
  bom1: "ap-south-1",
  cdg1: "eu-west-3",
  cle1: "us-east-2",
  cpt1: "af-south-1",
  dub1: "eu-west-1",
  fra1: "eu-central-1",
  gru1: "sa-east-1",
  hkg1: "ap-east-1",
  hnd1: "ap-northeast-1",
  iad1: "us-east-1",
  icn1: "ap-northeast-2",
  kix1: "ap-northeast-3",
  lhr1: "eu-west-2",
  pdx1: "us-west-2",
  sfo1: "us-west-1",
  sin1: "ap-southeast-1",
  syd1: "ap-southeast-2",
};

/** `ep-cool-name-a1b2c3.ap-southeast-1.aws.neon.tech` → `ap-southeast-1`. */
export function neonRegionFromHost(host: string): string | null {
  const match = /\.([a-z]{2}-[a-z]+-\d)\.(?:aws|azure|gcp)\.neon\.tech$/.exec(host);
  return match ? match[1] : null;
}

export function cloudRegionForVercelRegion(region: string | null | undefined): string | null {
  if (!region) return null;
  return VERCEL_REGION_TO_CLOUD[region] ?? null;
}

export function readPlacement(env: NodeJS.ProcessEnv = process.env): Placement {
  const url = resolveDatabaseUrl(env);
  let dbRegion: string | null = null;

  if (url) {
    try {
      dbRegion = neonRegionFromHost(new URL(url).hostname);
    } catch {
      dbRegion = null;
    }
  }

  const fnRegion = env.VERCEL_REGION ?? null;
  const fnCloud = cloudRegionForVercelRegion(fnRegion);

  return {
    database: dbRegion,
    function: fnRegion,
    // Unknown rather than false when either side cannot be read: a local Docker
    // database has no region, and saying "not colocated" about it would be
    // noise that trains people to ignore this field.
    colocated: dbRegion && fnCloud ? dbRegion === fnCloud : null,
  };
}
