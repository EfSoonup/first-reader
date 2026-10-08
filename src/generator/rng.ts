export interface Rng {
  next(): number;
}

/** mulberry32 – kleiner, reproduzierbarer Zufallsgenerator. */
export function erzeugeRng(seed: number): Rng {
  let a = seed >>> 0;
  return {
    next() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

export function zufallsInt(rng: Rng, max: number): number {
  return Math.floor(rng.next() * max);
}

export function waehle<T>(rng: Rng, liste: readonly T[]): T {
  if (liste.length === 0) throw new Error("waehle: leere Liste");
  return liste[zufallsInt(rng, liste.length)];
}

export function mische<T>(rng: Rng, liste: readonly T[]): T[] {
  const kopie = [...liste];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = zufallsInt(rng, i + 1);
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}

/** Zieht bis zu `anzahl` Werte ohne Zurücklegen, proportional zum Gewicht. */
export function gewichteteAuswahl<T>(
  rng: Rng,
  eintraege: readonly { wert: T; gewicht: number }[],
  anzahl: number,
): T[] {
  const rest = eintraege.filter((e) => e.gewicht > 0);
  const ergebnis: T[] = [];
  while (ergebnis.length < anzahl && rest.length > 0) {
    const summe = rest.reduce((s, e) => s + e.gewicht, 0);
    let ziel = rng.next() * summe;
    let index = 0;
    for (; index < rest.length - 1; index++) {
      ziel -= rest[index].gewicht;
      if (ziel < 0) break;
    }
    ergebnis.push(rest[index].wert);
    rest.splice(index, 1);
  }
  return ergebnis;
}
