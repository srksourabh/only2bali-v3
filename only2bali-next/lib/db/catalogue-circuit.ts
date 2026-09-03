/** Short-circuit catalogue reads after a database outage so page navigation stays fast. */

let openUntil = 0;

export function isCatalogueCircuitOpen(): boolean {
  return Date.now() < openUntil;
}

export function tripCatalogueCircuit(ms = 15_000): void {
  openUntil = Date.now() + ms;
}
