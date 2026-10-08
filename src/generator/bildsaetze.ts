import type { Schablone, WortEintrag } from "../content/typen";
import { lesbareWoerter } from "./bausteine";
import { grossschreiben, istLesbar } from "./grapheme";
import { waehle, type Rng } from "./rng";
import type { GeneratorKontext, LeseElement, SatzTeil } from "./typen";

export const NAME_PLATZHALTER = "[Name]";

export function istPlatzhalter(teil: string): boolean {
  return teil.startsWith("[") && teil.endsWith("]");
}

export function bildEtikett(teil: string): string | null {
  if (!istPlatzhalter(teil) || teil === NAME_PLATZHALTER) return null;
  return teil.slice(1, -1);
}

export function lesbareNamen(k: GeneratorKontext): WortEintrag[] {
  return lesbareWoerter(k).filter((w) => w.typ === "name");
}

function bilderMit(k: GeneratorKontext, etikett: string) {
  return k.inhalte.bilder.filter((b) => b.etiketten.includes(etikett));
}

export function nutzbareSchablonen(k: GeneratorKontext): Schablone[] {
  const namenDa = lesbareNamen(k).length > 0;
  return k.inhalte.schablonen.filter((s) =>
    s.teile.every((teil) => {
      if (teil === NAME_PLATZHALTER) return namenDa;
      const etikett = bildEtikett(teil);
      if (etikett !== null) return bilderMit(k, etikett).length > 0;
      return istLesbar(teil, k.bekannt, k.inhalte.inventar);
    }),
  );
}

export function erzeugeBildsatz(k: GeneratorKontext, rng: Rng, schablone: Schablone): LeseElement {
  const namen = lesbareNamen(k);
  const teile: SatzTeil[] = schablone.teile.map((teil) => {
    if (teil === NAME_PLATZHALTER) return { art: "text", text: waehle(rng, namen).text };
    const etikett = bildEtikett(teil);
    if (etikett !== null) {
      const bild = waehle(rng, bilderMit(k, etikett));
      return { art: "bild", emoji: bild.emoji, wort: bild.wort };
    }
    return { art: "text", text: teil };
  });
  const erstes = teile[0];
  if (erstes.art === "text") teile[0] = { art: "text", text: grossschreiben(erstes.text) };
  const text = teile.map((t) => (t.art === "text" ? t.text : t.emoji)).join(" ");
  return { typ: "satz", text, teile };
}

export function erzeugeBildsaetze(k: GeneratorKontext, rng: Rng, anzahl: number): LeseElement[] {
  const schablonen = nutzbareSchablonen(k);
  if (schablonen.length === 0) return [];
  const ergebnis = new Map<string, LeseElement>();
  for (let versuch = 0; versuch < anzahl * 20 && ergebnis.size < anzahl; versuch++) {
    const satz = erzeugeBildsatz(k, rng, waehle(rng, schablonen));
    ergebnis.set(satz.text, satz);
  }
  return [...ergebnis.values()];
}
