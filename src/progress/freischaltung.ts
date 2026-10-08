import type { AppDaten } from "./typen";

export const NEU_TAGE = 7;

export function bekannteGrapheme(daten: AppDaten): Set<string> {
  return new Set(daten.freischaltungen.map((f) => f.graphem));
}

export function neueGrapheme(daten: AppDaten, jetzt: Date): Set<string> {
  const grenze = jetzt.getTime() - NEU_TAGE * 24 * 60 * 60 * 1000;
  return new Set(daten.freischaltungen.filter((f) => new Date(f.datum).getTime() >= grenze).map((f) => f.graphem));
}

export function schalteUm(daten: AppDaten, graphem: string, jetzt: Date): AppDaten {
  if (bekannteGrapheme(daten).has(graphem)) {
    return {
      ...daten,
      freischaltungen: daten.freischaltungen.filter((f) => f.graphem !== graphem),
      spielstand: { ...daten.spielstand, offeneFeier: daten.spielstand.offeneFeier.filter((g) => g !== graphem) },
    };
  }
  return {
    ...daten,
    freischaltungen: [...daten.freischaltungen, { graphem, datum: jetzt.toISOString() }],
    spielstand: { ...daten.spielstand, offeneFeier: [...daten.spielstand.offeneFeier, graphem] },
  };
}

export function erledigeFeier(daten: AppDaten, graphem: string): AppDaten {
  return {
    ...daten,
    spielstand: { ...daten.spielstand, offeneFeier: daten.spielstand.offeneFeier.filter((g) => g !== graphem) },
  };
}
