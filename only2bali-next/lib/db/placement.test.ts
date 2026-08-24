import { describe, expect, it } from "vitest";
import { cloudRegionForVercelRegion, neonRegionFromHost, readPlacement } from "./placement";

describe("neonRegionFromHost", () => {
  it("reads the region out of a Neon hostname", () => {
    expect(neonRegionFromHost("ep-cool-name-a1b2c3.ap-southeast-1.aws.neon.tech")).toBe("ap-southeast-1");
    expect(neonRegionFromHost("ep-x-1.us-east-2.aws.neon.tech")).toBe("us-east-2");
  });

  it("handles the pooled hostname, which is the one actually configured", () => {
    expect(neonRegionFromHost("ep-cool-name-a1b2c3-pooler.ap-south-1.aws.neon.tech")).toBe("ap-south-1");
  });

  it("returns nothing for hosts that carry no region", () => {
    expect(neonRegionFromHost("127.0.0.1")).toBeNull();
    expect(neonRegionFromHost("db.example.com")).toBeNull();
  });
});

describe("cloudRegionForVercelRegion", () => {
  it("maps the regions this project actually uses", () => {
    expect(cloudRegionForVercelRegion("iad1")).toBe("us-east-1");
    expect(cloudRegionForVercelRegion("bom1")).toBe("ap-south-1");
  });

  it("does not invent a mapping it does not have", () => {
    expect(cloudRegionForVercelRegion("zzz9")).toBeNull();
    expect(cloudRegionForVercelRegion(null)).toBeNull();
  });
});

describe("readPlacement", () => {
  it("reports a mismatch when the function and the database are apart", () => {
    expect(
      readPlacement({
        DATABASE_URL: "postgres://u:p@ep-x-pooler.ap-south-1.aws.neon.tech/neondb",
        VERCEL_REGION: "iad1",
      } as unknown as NodeJS.ProcessEnv)
    ).toEqual({ database: "ap-south-1", function: "iad1", colocated: false });
  });

  it("reports agreement when they are together", () => {
    expect(
      readPlacement({
        DATABASE_URL: "postgres://u:p@ep-x-pooler.us-east-1.aws.neon.tech/neondb",
        VERCEL_REGION: "iad1",
      } as unknown as NodeJS.ProcessEnv)
    ).toEqual({ database: "us-east-1", function: "iad1", colocated: true });
  });

  it("says unknown rather than false when there is no region to compare", () => {
    // Local Docker has no region. Calling that "not colocated" would be noise.
    expect(
      readPlacement({ DATABASE_URL: "postgres://u:p@127.0.0.1:5432/only2bali" } as unknown as NodeJS.ProcessEnv)
    ).toEqual({ database: null, function: null, colocated: null });
  });

  it("never reports the hostname itself", () => {
    const placement = readPlacement({
      DATABASE_URL: "postgres://u:secret@ep-private-name.ap-south-1.aws.neon.tech/neondb",
      VERCEL_REGION: "bom1",
    } as unknown as NodeJS.ProcessEnv);
    expect(JSON.stringify(placement)).not.toContain("ep-private-name");
    expect(JSON.stringify(placement)).not.toContain("secret");
  });
});
