import {
  buchstabenElemente, geschlosseneSilben, offeneSilben, woerterAlsElemente,
} from "./bausteine";
import { erzeugeBildsaetze } from "./bildsaetze";
import { gewichteteElemente } from "./gewichtung";
import { grossschreiben } from "./grapheme";
import { erzeugePseudowoerter } from "./pseudowoerter";
import { mische, type Rng } from "./rng";
import type { GeneratorKontext, LeseElement, Leseblatt, Zeile } from "./typen";

export const REIHE_LANG = 8;
export const WORT_REIHE = 6;
export const MAX_WORT_ZEILEN = 3;
const GROSS_ANTEIL = 0.2;

export function buchstabenZeilenAnzahl(anzahlBekannt: number): number {
  if (anzahlBekannt <= 3) return 2;
  if (anzahlBekannt <= 5) return 1;
  return 0;
}

/** Zufällige Reihe mit Wiederholungen, aber nie zweimal dasselbe direkt hintereinander. */
function zufallsReihe(k: GeneratorKontext, rng: Rng, pool: readonly LeseElement[], laenge: number): LeseElement[] {
  const reihe: LeseElement[] = [];
  for (let i = 0; i < laenge; i++) {
    const vorher = reihe.at(-1)?.text;
    const kandidaten = pool.length > 1 ? pool.filter((e) => e.text !== vorher) : pool;
    reihe.push(gewichteteElemente(k, rng, kandidaten, 1)[0]);
  }
  return reihe;
}

function variiereGross(rng: Rng, el: LeseElement): LeseElement {
  return rng.next() < GROSS_ANTEIL ? { ...el, text: grossschreiben(el.text) } : el;
}

export function erzeugeLeseblatt(k: GeneratorKontext, rng: Rng): Leseblatt {
  const zeilen: Zeile[] = [];

  const buchstaben = buchstabenElemente(k);
  if (buchstaben.length > 0) {
    for (let i = 0; i < buchstabenZeilenAnzahl(k.bekannt.size); i++) {
      zeilen.push({ art: "buchstaben", stern: false, elemente: zufallsReihe(k, rng, buchstaben, REIHE_LANG) });
    }
  }

  const silben = [...offeneSilben(k), ...geschlosseneSilben(k)];
  if (silben.length >= 2) {
    for (let i = 0; i < 2; i++) {
      const reihe = zufallsReihe(k, rng, silben, REIHE_LANG).map((el) => variiereGross(rng, el));
      zeilen.push({ art: "silben", stern: false, elemente: reihe });
    }
  }

  const maxWoerter = MAX_WORT_ZEILEN * WORT_REIHE;
  const echte = gewichteteElemente(k, rng, woerterAlsElemente(k), maxWoerter / 2);
  const echteTexte = new Set(echte.map((e) => e.text.toLowerCase()));
  const pseudo = erzeugePseudowoerter(k, rng, maxWoerter)
    .filter((e) => !echteTexte.has(e.text.toLowerCase()))
    .slice(0, maxWoerter - echte.length);
  const woerter = mische(rng, [...echte, ...pseudo]);
  let wortZeilen = 0;
  for (let i = 0; i < woerter.length; i += WORT_REIHE) {
    zeilen.push({ art: "woerter", stern: false, elemente: woerter.slice(i, i + WORT_REIHE) });
    wortZeilen++;
  }

  const satzAnzahl = wortZeilen === MAX_WORT_ZEILEN ? 4 : 5;
  for (const satz of erzeugeBildsaetze(k, rng, satzAnzahl)) {
    zeilen.push({ art: "saetze", stern: true, elemente: [satz] });
  }

  return { zeilen };
}
