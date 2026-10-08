import { elementWoerter } from "./bausteine";
import { zerlege } from "./grapheme";
import { gewichteteAuswahl, type Rng } from "./rng";
import type { GeneratorKontext, LeseElement } from "./typen";

export const GEWICHT_NEU = 3;
export const GEWICHT_KUERZLICH = 0.1;

export function enthaeltNeuesGraphem(el: LeseElement, k: GeneratorKontext): boolean {
  if (k.neu.size === 0) return false;
  return elementWoerter(el).some((w) =>
    (zerlege(w, k.inhalte.inventar) ?? []).some((g) => k.neu.has(g)),
  );
}

export function gewicht(el: LeseElement, k: GeneratorKontext): number {
  let g = 1;
  if (enthaeltNeuesGraphem(el, k)) g *= GEWICHT_NEU;
  if (k.kuerzlich.has(el.text)) g *= GEWICHT_KUERZLICH;
  return g;
}

export function gewichteteElemente(
  k: GeneratorKontext,
  rng: Rng,
  kandidaten: readonly LeseElement[],
  anzahl: number,
): LeseElement[] {
  return gewichteteAuswahl(rng, kandidaten.map((wert) => ({ wert, gewicht: gewicht(wert, k) })), anzahl);
}
