import { abbildbareWoerter, BONUS_MIN_WOERTER } from "../generator/bonus";
import { lesbareWoerter } from "../generator/bausteine";
import { nutzbareSchablonen } from "../generator/bildsaetze";
import type { GeneratorKontext } from "../generator/typen";
import type { Inhalte } from "./typen";

export interface Reihenfolge { name: string; grapheme: string[] }

const REST = "d h au ei w f g b k sch ch p z ie eu j ck ä ö ü v ng nk pf qu st sp ß äu c x y";

/** Typische Fibel-Reihenfolgen (Anfang); fehlende Grapheme werden hinten angehängt. */
export const REIHENFOLGEN: Reihenfolge[] = [
  { name: "M A I O L S E R U N T", grapheme: `m a i o l s e r u n t ${REST}`.split(" ") },
  { name: "M I A L O T S E N R U", grapheme: `m i a l o t s e n r u ${REST}`.split(" ") },
  { name: "A M L O I E S T N R U", grapheme: `a m l o i e s t n r u ${REST}`.split(" ") },
  { name: "O M A L I E T N S R U", grapheme: `o m a l i e t n s r u ${REST}`.split(" ") },
  { name: "M A L I O E N S T R U", grapheme: `m a l i o e n s t r u ${REST}`.split(" ") },
];

export interface AbdeckungsSchritt {
  anzahl: number;            // bekannte Grapheme nach diesem Schritt
  graphem: string;           // in diesem Schritt neu
  woerter: number;           // lesbare Einträge (Wörter + Namen)
  namen: number;
  abbildbar: number;
  bonusFrei: boolean;
  schablonen: number;        // nutzbare Satzschablonen
}

export function vollstaendig(reihenfolge: readonly string[], inhalte: Inhalte): string[] {
  const rest = inhalte.inventar.map((i) => i.g).filter((g) => !reihenfolge.includes(g));
  return [...reihenfolge.filter((g) => inhalte.inventar.some((i) => i.g === g)), ...rest];
}

export function abdeckung(reihenfolge: readonly string[], inhalte: Inhalte): AbdeckungsSchritt[] {
  const schritte: AbdeckungsSchritt[] = [];
  const bekannt = new Set<string>();
  for (const g of vollstaendig(reihenfolge, inhalte)) {
    bekannt.add(g);
    const k: GeneratorKontext = {
      bekannt, neu: new Set(), kuerzlich: new Set(), wiederholungen: [], inhalte,
    };
    const lesbar = lesbareWoerter(k);
    const abbildbar = abbildbareWoerter(k).length;
    schritte.push({
      anzahl: bekannt.size,
      graphem: g,
      woerter: lesbar.length,
      namen: lesbar.filter((w) => w.typ === "name").length,
      abbildbar,
      bonusFrei: abbildbar >= BONUS_MIN_WOERTER,
      schablonen: nutzbareSchablonen(k).length,
    });
  }
  return schritte;
}
