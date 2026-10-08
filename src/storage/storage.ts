import { tagSchluessel } from "../progress/auswertung";
import { leereDaten, type AppDaten } from "../progress/typen";

export const SPEICHER_SCHLUESSEL = "lesestart-daten";
export const DEFEKT_PRAEFIX = "lesestart-daten-defekt-";
export const SICHERUNG_NACH_TAGEN = 14;

export interface Speicher {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}
/** `schreibschutz`: kaputte Rohdaten liegen nur noch unter dem Hauptschlüssel – nicht überschreiben. */
export interface LadeErgebnis { daten: AppDaten; fehler: string | null; schreibschutz?: true }

export function holeSpeicher(): Speicher | null {
  try {
    const sp = window.localStorage;
    const test = "__lesestart_test__";
    sp.setItem(test, "1");
    sp.removeItem(test);
    return sp;
  } catch {
    return null;
  }
}

const istObjekt = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const istString = (x: unknown): x is string => typeof x === "string";
const istZahl = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const istListe = <T>(x: unknown, pruefe: (e: unknown) => e is T): x is T[] => Array.isArray(x) && x.every(pruefe);

const istFreischaltung = (x: unknown): x is AppDaten["freischaltungen"][number] =>
  istObjekt(x) && istString(x.graphem) && istString(x.datum);
const istWiederholung = (x: unknown): x is AppDaten["wiederholungen"][number] =>
  istObjekt(x) && istString(x.text) && istString(x.typ) && istZahl(x.richtigInFolge);
const istSitzung = (x: unknown): x is AppDaten["sitzungen"][number] =>
  istObjekt(x) && istString(x.id) && istString(x.start) && istString(x.ende) &&
  istZahl(x.aktiveSekunden) && istZahl(x.richtig) && istZahl(x.fehlversuche) &&
  istListe(x.gezeigteElemente, istString);
const istStringListe = (x: unknown): x is string[] => istListe(x, istString);

export function pruefeDaten(roh: unknown): AppDaten | null {
  if (!istObjekt(roh) || roh.schemaVersion !== 1) return null;
  const sp = roh.spielstand;
  const ein = roh.einstellungen;
  const gueltig =
    istString(roh.angelegtAm) &&
    istListe(roh.freischaltungen, istFreischaltung) &&
    istListe(roh.sitzungen, istSitzung) &&
    istListe(roh.wiederholungen, istWiederholung) &&
    istObjekt(sp) && istZahl(sp.sterne) && istListe(sp.stickerAlben, istStringListe) &&
    (sp.letzterStickerTag === null || istString(sp.letzterStickerTag)) && istStringListe(sp.offeneFeier) &&
    istObjekt(ein) && istZahl(ein.tageszielMinuten) && ein.tageszielMinuten > 0 &&
    (roh.letzteSicherung === null || istString(roh.letzteSicherung));
  return gueltig ? (roh as unknown as AppDaten) : null;
}

export function ladeDaten(speicher: Speicher | null, jetzt: Date): LadeErgebnis {
  if (!speicher) {
    return { daten: leereDaten(jetzt), fehler: "Browser-Speicher nicht verfügbar – Fortschritt wird nicht gespeichert." };
  }
  const roh = speicher.getItem(SPEICHER_SCHLUESSEL);
  if (roh === null) return { daten: leereDaten(jetzt), fehler: null };
  let daten: AppDaten | null = null;
  try {
    daten = pruefeDaten(JSON.parse(roh));
  } catch {
    daten = null;
  }
  if (daten) return { daten, fehler: null };
  try {
    speicher.setItem(DEFEKT_PRAEFIX + jetzt.toISOString(), roh);
  } catch {
    return {
      daten: leereDaten(jetzt),
      fehler:
        "Gespeicherte Daten waren unlesbar und konnten nicht extra gesichert werden (Speicher voll?). " +
        "Damit sie nicht verloren gehen, wird vorerst nicht gespeichert.",
      schreibschutz: true,
    };
  }
  return {
    daten: leereDaten(jetzt),
    fehler: "Gespeicherte Daten waren unlesbar. Sie wurden beiseitegelegt; bitte eine Sicherung importieren.",
  };
}

export function speichereDaten(speicher: Speicher | null, daten: AppDaten): boolean {
  if (!speicher) return false;
  try {
    speicher.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(daten));
    return true;
  } catch {
    return false;
  }
}

export function exportiere(daten: AppDaten, jetzt: Date): { json: string; daten: AppDaten; dateiname: string } {
  const neu = { ...daten, letzteSicherung: jetzt.toISOString() };
  return {
    json: JSON.stringify(neu, null, 2),
    daten: neu,
    dateiname: `lesestart-sicherung-${tagSchluessel(jetzt)}.json`,
  };
}

export function importiere(text: string): { ok: true; daten: AppDaten } | { ok: false; fehler: string } {
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    return { ok: false, fehler: "Die Datei ist keine gültige JSON-Datei." };
  }
  const daten = pruefeDaten(roh);
  return daten ? { ok: true, daten } : { ok: false, fehler: "Die Datei ist keine Lesestart-Sicherung." };
}

export function sicherungFaellig(daten: AppDaten, jetzt: Date): boolean {
  const seit = new Date(daten.letzteSicherung ?? daten.angelegtAm).getTime();
  return jetzt.getTime() - seit > SICHERUNG_NACH_TAGEN * 24 * 60 * 60 * 1000;
}
