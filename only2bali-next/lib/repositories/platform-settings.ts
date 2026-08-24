import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { platformSetting } from "@/lib/db/schema";
import {
  DEFAULT_PLATFORM_FEE_RATE,
  DEFAULT_PLATFORM_FEE_RATE_STRING,
  PLATFORM_FEE_SETTING_KEY,
  feeRateToPercent,
  parseFeeRate,
  percentToFeeRate,
  toFeeRateString,
} from "@/lib/payments/fee";

type SettingReader = Pick<typeof db, "select">;

export type PlatformFeeSetting = {
  key: typeof PLATFORM_FEE_SETTING_KEY;
  rate: number;
  rateString: string;
  percent: number;
};

function asSetting(rate: number): PlatformFeeSetting {
  const rateString = toFeeRateString(rate);
  return {
    key: PLATFORM_FEE_SETTING_KEY,
    rate,
    rateString,
    percent: feeRateToPercent(rate),
  };
}

export async function getPlatformFeeSetting(executor: SettingReader = db): Promise<PlatformFeeSetting> {
  try {
    const [row] = await executor
      .select({ value: platformSetting.value })
      .from(platformSetting)
      .where(eq(platformSetting.key, PLATFORM_FEE_SETTING_KEY))
      .limit(1);
    return asSetting(parseFeeRate(row?.value, DEFAULT_PLATFORM_FEE_RATE));
  } catch {
    return asSetting(DEFAULT_PLATFORM_FEE_RATE);
  }
}

export async function getPlatformFeeRate(executor: SettingReader = db): Promise<number> {
  return (await getPlatformFeeSetting(executor)).rate;
}

export async function setPlatformFeePercent(
  percent: number,
  updatedBy: string | null
): Promise<PlatformFeeSetting> {
  const rate = percentToFeeRate(percent);
  const rateString = toFeeRateString(rate);
  await db
    .insert(platformSetting)
    .values({
      key: PLATFORM_FEE_SETTING_KEY,
      value: rateString,
      updatedBy,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: platformSetting.key,
      set: { value: rateString, updatedBy, updatedAt: new Date() },
    });
  return asSetting(rate);
}

export { DEFAULT_PLATFORM_FEE_RATE, DEFAULT_PLATFORM_FEE_RATE_STRING };
