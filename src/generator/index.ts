import { erzeugeAufwaermen } from "./aufwaermen";
import { geschlosseneSilben, lesbareWoerter, offeneSilben, silbenVokale } from "./bausteine";
import { erzeugeBonus } from "./bonus";
import { zerlege } from "./grapheme";
import { erzeugeLeseblatt } from "./leseblatt";
import { erzeugeRng } from "./rng";
import type { GeneratorKontext, Tagesmaterial } from "./typen";

export type BuchstabenStand = { ok: true } | { ok: false; fehlt: "vokal" | "konsonant" };

export function pruefeBuchstabenStand(k: GeneratorKontext): BuchstabenStand {
  if (offeneSilben(k).length > 0 || geschlosseneSilben(k).length > 0) return { ok: true };
  return { ok: false, fehlt: silbenVokale(k).length > 0 ? "konsonant" : "vokal" };
}

export function generiere(k: GeneratorKontext, seed: number): Tagesmaterial {
  const rng = erzeugeRng(seed);
  return {
    aufwaermen: erzeugeAufwaermen(k, rng),
    leseblatt: erzeugeLeseblatt(k, rng),
    bonus: erzeugeBonus(k, rng),
  };
}

export function zaehleWoerterMitGraphem(k: GeneratorKontext, graphem: string): number {
  return lesbareWoerter(k).filter((w) =>
    (zerlege(w.text, k.inhalte.inventar, w.zerlegung) ?? []).includes(graphem),
  ).length;
}

export { erzeugeLeseblatt } from "./leseblatt";
export { erzeugeRng } from "./rng";
export type * from "./typen";
