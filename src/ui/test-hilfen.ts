import { vi, type Mock } from "vitest";
import { schalteUm } from "../progress/freischaltung";
import { leereDaten, type AppDaten } from "../progress/typen";
import type { Aktualisiere } from "./useAppDaten";

export function datenMit(grapheme: string[]): AppDaten {
  let d = leereDaten(new Date(2026, 8, 1));
  for (const g of grapheme) d = schalteUm(d, g, new Date(2026, 8, 1));
  return { ...d, spielstand: { ...d.spielstand, offeneFeier: [] } };
}

export function aktualisiereSpy(start: AppDaten) {
  let aktuell = start;
  const fn = vi.fn((f: (d: AppDaten) => AppDaten) => { aktuell = f(aktuell); }) as Aktualisiere & Mock;
  return { fn, get daten() { return aktuell; } };
}
