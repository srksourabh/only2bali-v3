const breakers = new Map<string, { failures: number; openUntil: number }>();

export class CircuitOpenError extends Error {
  constructor(provider: string) {
    super(`${provider} is temporarily unavailable.`);
    this.name = "CircuitOpenError";
  }
}

export async function resilientFetch(provider: string, input: string | URL, init: RequestInit = {}) {
  const now = Date.now();
  const state = breakers.get(provider) ?? { failures: 0, openUntil: 0 };
  if (state.openUntil > now) throw new CircuitOpenError(provider);
  try {
    const response = await fetch(input, { ...init, signal: init.signal ?? AbortSignal.timeout(1_500) });
    if (response.status === 429 || response.status >= 500) throw new Error(`${provider} returned HTTP ${response.status}.`);
    breakers.set(provider, { failures: 0, openUntil: 0 });
    return response;
  } catch (error) {
    const failures = state.failures + 1;
    breakers.set(provider, { failures, openUntil: failures >= 3 ? now + 30_000 : 0 });
    throw error;
  }
}
