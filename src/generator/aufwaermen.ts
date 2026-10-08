import { elementIstLesbar, geschlosseneSilben, offeneSilben, woerterAlsElemente } from "./bausteine";
import { gewichteteElemente } from "./gewichtung";
import { erzeugePseudowoerter } from "./pseudowoerter";
import { mische, type Rng } from "./rng";
import type { GeneratorKontext, LeseElement } from "./typen";

export const AUFWAERM_ANZAHL = 8;
export const MAX_WIEDERHOLUNGEN = 4;

export function erzeugeAufwaermen(k: GeneratorKontext, rng: Rng): LeseElement[] {
  const wiederholt = mische(
    rng,
    k.wiederholungen
      .filter((w) => w.typ !== "satz" && w.typ !== "buchstabe")
      .map((w): LeseElement => ({ typ: w.typ, text: w.text }))
      .filter((el) => elementIstLesbar(el, k)),
  ).slice(0, MAX_WIEDERHOLUNGEN);

  const vergeben = new Set(wiederholt.map((e) => e.text.toLowerCase()));
  const kandidaten = new Map<string, LeseElement>();
  for (const el of [
    ...offeneSilben(k),
    ...geschlosseneSilben(k),
    ...woerterAlsElemente(k),
    ...erzeugePseudowoerter(k, rng, 20),
  ]) {
    const schluessel = el.text.toLowerCase();
    if (!vergeben.has(schluessel) && !kandidaten.has(schluessel)) kandidaten.set(schluessel, el);
  }

  const rest = gewichteteElemente(k, rng, [...kandidaten.values()], AUFWAERM_ANZAHL - wiederholt.length);
  return mische(rng, [...wiederholt, ...rest]);
}
