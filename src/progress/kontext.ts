import type { Inhalte } from "../content/typen";
import type { GeneratorKontext } from "../generator/typen";
import { bekannteGrapheme, neueGrapheme } from "./freischaltung";
import type { AppDaten } from "./typen";

export const KUERZLICH_SITZUNGEN = 2;

export function baueKontext(daten: AppDaten, inhalte: Inhalte, jetzt: Date): GeneratorKontext {
  const letzte = [...daten.sitzungen]
    .sort((a, b) => b.start.localeCompare(a.start))
    .slice(0, KUERZLICH_SITZUNGEN);
  return {
    bekannt: bekannteGrapheme(daten),
    neu: neueGrapheme(daten, jetzt),
    kuerzlich: new Set(letzte.flatMap((s) => s.gezeigteElemente)),
    wiederholungen: daten.wiederholungen.map(({ text, typ }) => ({ text, typ })),
    inhalte,
  };
}
