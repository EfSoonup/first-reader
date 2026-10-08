import type { ElementTyp } from "../generator/typen";

export interface Freischaltung { graphem: string; datum: string }            // ISO
export interface Wiederholung { text: string; typ: ElementTyp; richtigInFolge: number }
export interface Sitzung {
  id: string; start: string; ende: string;
  aktiveSekunden: number; richtig: number; fehlversuche: number;
  gezeigteElemente: string[];
}
export interface Spielstand { sterne: number; stickerAlben: string[][]; letzterStickerTag: string | null; offeneFeier: string[] }
export interface Einstellungen { tageszielMinuten: number }
export interface AppDaten {
  schemaVersion: 1;
  angelegtAm: string;
  freischaltungen: Freischaltung[];
  sitzungen: Sitzung[];
  wiederholungen: Wiederholung[];
  spielstand: Spielstand;
  einstellungen: Einstellungen;
  letzteSicherung: string | null;
}

export const STANDARD_TAGESZIEL_MINUTEN = 10;

export function leereDaten(jetzt: Date): AppDaten {
  return {
    schemaVersion: 1,
    angelegtAm: jetzt.toISOString(),
    freischaltungen: [],
    sitzungen: [],
    wiederholungen: [],
    spielstand: { sterne: 0, stickerAlben: [], letzterStickerTag: null, offeneFeier: [] },
    einstellungen: { tageszielMinuten: STANDARD_TAGESZIEL_MINUTEN },
    letzteSicherung: null,
  };
}
