const FALLBACK_RATES = {
  USD: 1,
  IDR: 16400,
  EUR: 0.92,
  AUD: 1.51,
  SGD: 1.35,
  INR: 83.5,
  GBP: 0.79,
};

const CACHE_KEY = "only2bali_fx_rates";
const CACHE_TIME_KEY = "only2bali_fx_rates_timestamp";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const fetchRates = async () => {
  // Check local cache first
  try {
    const cachedRatesStr = localStorage.getItem(CACHE_KEY);
    const cachedTimeStr = localStorage.getItem(CACHE_TIME_KEY);
    if (cachedRatesStr && cachedTimeStr) {
      const cachedTime = parseInt(cachedTimeStr, 10);
      if (Date.now() - cachedTime < ONE_DAY_MS) {
        return JSON.parse(cachedRatesStr);
      }
    }
  } catch (e) {
    console.warn("Failed to check exchange rates cache", e);
  }

  // Fetch with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second hard timeout

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error("FX rates API error");
    const data = await res.json();
    if (data && data.rates) {
      const rates = data.rates;
      const targetRates = {
        USD: 1,
        IDR: rates.IDR || FALLBACK_RATES.IDR,
        EUR: rates.EUR || FALLBACK_RATES.EUR,
        AUD: rates.AUD || FALLBACK_RATES.AUD,
        SGD: rates.SGD || FALLBACK_RATES.SGD,
        INR: rates.INR || FALLBACK_RATES.INR,
        GBP: rates.GBP || FALLBACK_RATES.GBP,
      };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(targetRates));
        localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
      } catch (e) {
        console.warn("Failed to write exchange rates to cache", e);
      }
      return targetRates;
    }
  } catch (err) {
    console.warn("Exchange rates fetch failed. Using fallback rates.", err);
  } finally {
    clearTimeout(timeoutId);
  }

  // Try retrieving expired cache if network failed
  try {
    const cachedRatesStr = localStorage.getItem(CACHE_KEY);
    if (cachedRatesStr) {
      return JSON.parse(cachedRatesStr);
    }
  } catch (e) {}

  return FALLBACK_RATES;
};

export const formatCurrency = (amountUsd, rate, currencyCode) => {
  const amount = amountUsd * rate;
  if (currencyCode === "IDR") {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  if (currencyCode === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  const formatterMap = {
    USD: { locale: "en-US", symbol: "$" },
    EUR: { locale: "de-DE", symbol: "€" },
    AUD: { locale: "en-AU", symbol: "A$" },
    SGD: { locale: "en-SG", symbol: "S$" },
    GBP: { locale: "en-GB", symbol: "£" },
  };

  const fmt = formatterMap[currencyCode] || formatterMap.USD;
  return new Intl.NumberFormat(fmt.locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
};
