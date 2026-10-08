import { grossschreiben, istGesperrt } from "./grapheme";
import { passtZerlegung, silbenKonsonanten, silbenVokale } from "./bausteine";
import { waehle, type Rng } from "./rng";
import type { GeneratorKontext, LeseElement } from "./typen";

type Form = "KV" | "V" | "KVK";

const MUSTER_KURZ: Form[][] = [["KV", "KV"], ["V", "KV"], ["KV", "V"], ["KV", "KVK"]];
const MUSTER_LANG: Form[][] = [
  ["KV", "KV", "KV"], ["V", "KV", "KV"], ["KV", "KV", "KVK"], // 3 Silben
  ["KVK", "KV"], ["V", "KVK", "KV"],                         // mit Konsonantenhäufung (max. 2)
];
export const LANG_AB = 10;
const VERSUCHE = 20;

function baueGrapheme(muster: Form[], k: GeneratorKontext, rng: Rng): string[] | null {
  const vokale = silbenVokale(k);
  const konsonanten = silbenKonsonanten(k);
  const folge = muster.flatMap((f) => f.split("")) as ("K" | "V")[];
  const teile: string[] = [];
  for (let i = 0; i < folge.length; i++) {
    const erstes = i === 0;
    const letztes = i === folge.length - 1;
    const pool =
      folge[i] === "V"
        ? vokale
        : konsonanten.filter(
            (info) =>
              (!erstes || info.anfang !== false) &&
              (!letztes || info.ende !== false) &&
              (erstes || !info.nurWortanfang),
          );
    if (pool.length === 0) return null;
    teile.push(waehle(rng, pool).g);
  }
  return teile;
}

export function erzeugePseudowort(k: GeneratorKontext, rng: Rng): LeseElement | null {
  if (silbenVokale(k).length === 0 || silbenKonsonanten(k).length === 0) return null;
  const muster = k.bekannt.size >= LANG_AB ? [...MUSTER_KURZ, ...MUSTER_LANG] : MUSTER_KURZ;
  const echteWoerter = new Map(k.inhalte.woerter.map((w) => [w.text.toLowerCase(), w]));
  for (let versuch = 0; versuch < VERSUCHE; versuch++) {
    const teile = baueGrapheme(waehle(rng, muster), k, rng);
    if (!teile) continue;
    const text = teile.join("");
    if (!passtZerlegung(text, teile, k)) continue;
    if (istGesperrt(text, k.inhalte.sperrliste)) continue;
    const echt = echteWoerter.get(text);
    if (echt) return { typ: "wort", text: echt.text };
    return { typ: "pseudowort", text: grossschreiben(text) };
  }
  return null;
}

export function erzeugePseudowoerter(k: GeneratorKontext, rng: Rng, anzahl: number): LeseElement[] {
  const ergebnis = new Map<string, LeseElement>();
  for (let versuch = 0; versuch < anzahl * VERSUCHE && ergebnis.size < anzahl; versuch++) {
    const el = erzeugePseudowort(k, rng);
    if (!el) {
      if (silbenVokale(k).length === 0 || silbenKonsonanten(k).length === 0) break;
      continue;
    }
    ergebnis.set(el.text.toLowerCase(), el);
  }
  return [...ergebnis.values()];
}
