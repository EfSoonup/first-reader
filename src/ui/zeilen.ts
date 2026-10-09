import type { LeseElement, Leseblatt, Zeile } from "../generator/typen";

/** Teilt `elemente` der Reihe nach in `anzahl` möglichst gleich große Stücke (vordere Stücke bekommen den Rest). */
function gleichmaessig<T>(elemente: T[], anzahl: number): T[][] {
  const stuecke: T[][] = [];
  let start = 0;
  for (let i = 0; i < anzahl; i++) {
    const laenge = Math.floor(elemente.length / anzahl) + (i < elemente.length % anzahl ? 1 : 0);
    stuecke.push(elemente.slice(start, start + laenge));
    start += laenge;
  }
  return stuecke;
}

function teile(zeile: Zeile, passt: (elemente: LeseElement[]) => boolean): Zeile[] {
  const n = zeile.elemente.length;
  for (let anzahl = 1; anzahl < n; anzahl++) {
    const stuecke = gleichmaessig(zeile.elemente, anzahl);
    if (stuecke.every(passt)) return stuecke.map((elemente) => ({ ...zeile, elemente }));
  }
  return zeile.elemente.map((el) => ({ ...zeile, elemente: [el] }));
}

/**
 * Auf schmalen Bildschirmen würde eine Schulblatt-Zeile (8 Silben, 6 Wörter) in mehrere Reihen umbrechen und
 * wäre nicht mehr als Zeile lesbar. Passt sie nicht, wird sie in so wenige gleich lange Zeilen wie nötig geteilt.
 * Inhalt und Reihenfolge des Blatts bleiben gleich; Satzzeilen dürfen umbrechen und werden nie geteilt.
 */
export function teileZeilen(blatt: Leseblatt, passt: (elemente: LeseElement[]) => boolean): Leseblatt {
  return { zeilen: blatt.zeilen.flatMap((z) => (z.art === "saetze" ? [z] : teile(z, passt))) };
}
