import type { WortEintrag } from "../content/typen";
import { lesbareWoerter } from "./bausteine";
import { mische, type Rng } from "./rng";
import type { BonusRunde, GeneratorKontext } from "./typen";

export const BONUS_RUNDEN = 6;
export const BONUS_MIN_WOERTER = 4;

export function abbildbareWoerter(k: GeneratorKontext): WortEintrag[] {
  return lesbareWoerter(k).filter((w) => w.emoji && w.kategorie);
}

export function erzeugeBonus(k: GeneratorKontext, rng: Rng): BonusRunde[] | null {
  const ziele = abbildbareWoerter(k);
  if (ziele.length < BONUS_MIN_WOERTER) return null;

  const bildpool = new Map<string, { emoji: string; kategorie: string }>();
  for (const w of k.inhalte.woerter) {
    if (w.emoji && w.kategorie) bildpool.set(w.emoji, { emoji: w.emoji, kategorie: w.kategorie });
  }
  for (const b of k.inhalte.bilder) {
    if (!bildpool.has(b.emoji)) bildpool.set(b.emoji, { emoji: b.emoji, kategorie: b.kategorie });
  }

  const reihenfolge = mische(rng, ziele);
  const runden: BonusRunde[] = [];
  for (let i = 0; i < BONUS_RUNDEN; i++) {
    const ziel = reihenfolge[i % reihenfolge.length];
    const andere = [...bildpool.values()].filter((b) => b.emoji !== ziel.emoji);
    const fremd = andere.filter((b) => b.kategorie !== ziel.kategorie);
    const ablenker = mische(rng, fremd.length >= 2 ? fremd : andere).slice(0, 2);
    runden.push({
      wort: ziel.text,
      optionen: mische(rng, [
        { emoji: ziel.emoji!, richtig: true },
        ...ablenker.map((b) => ({ emoji: b.emoji, richtig: false })),
      ]),
    });
  }
  return runden;
}
