/** A lead name is enough. Extra names are optional until check-in. */
export function namedTravellersFitGroup(pax: number, namedCount: number): boolean {
  return namedCount >= 1 && namedCount <= pax;
}
