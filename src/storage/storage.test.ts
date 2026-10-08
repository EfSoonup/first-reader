import { describe, expect, it } from "vitest";
import { leereDaten } from "../progress/typen";
import {
  DEFEKT_PRAEFIX, exportiere, importiere, ladeDaten, pruefeDaten, sicherungFaellig, SPEICHER_SCHLUESSEL,
  speichereDaten, type Speicher,
} from "./storage";

class TestSpeicher implements Speicher {
  daten = new Map<string, string>();
  getItem(k: string) { return this.daten.get(k) ?? null; }
  setItem(k: string, v: string) { this.daten.set(k, v); }
}
class VollerSpeicher extends TestSpeicher {
  setItem() { throw new Error("QuotaExceededError"); }
}

const jetzt = new Date(2026, 9, 8, 10);
const beispiel = () => ({
  ...leereDaten(jetzt),
  freischaltungen: [{ graphem: "m", datum: jetzt.toISOString() }],
  sitzungen: [{ id: "a", start: jetzt.toISOString(), ende: jetzt.toISOString(), aktiveSekunden: 60, richtig: 3, fehlversuche: 1, gezeigteElemente: ["mi"] }],
});

describe("Speicherung", () => {
  it("speichert und lädt identisch", () => {
    const sp = new TestSpeicher();
    expect(speichereDaten(sp, beispiel())).toBe(true);
    expect(ladeDaten(sp, jetzt)).toEqual({ daten: beispiel(), fehler: null });
  });

  it("liefert leere Daten, wenn nichts gespeichert ist", () => {
    expect(ladeDaten(new TestSpeicher(), jetzt)).toEqual({ daten: leereDaten(jetzt), fehler: null });
  });

  it("meldet fehlenden Speicher", () => {
    const e = ladeDaten(null, jetzt);
    expect(e.fehler).toMatch(/nicht verfügbar/);
    expect(speichereDaten(null, e.daten)).toBe(false);
  });

  it("meldet volle Speicher beim Schreiben", () => {
    expect(speichereDaten(new VollerSpeicher(), beispiel())).toBe(false);
  });

  it("sichert kaputte Rohdaten, bevor neu begonnen wird", () => {
    const sp = new TestSpeicher();
    sp.setItem(SPEICHER_SCHLUESSEL, "{kaputt");
    const e = ladeDaten(sp, jetzt);
    expect(e.fehler).toMatch(/unlesbar/);
    expect(e.daten).toEqual(leereDaten(jetzt));
    const sicherung = [...sp.daten.entries()].find(([k]) => k.startsWith(DEFEKT_PRAEFIX));
    expect(sicherung?.[1]).toBe("{kaputt");
  });

  it("pruefeDaten lehnt fremde Strukturen und unbekannte Versionen ab", () => {
    expect(pruefeDaten({ foo: 1 })).toBeNull();
    expect(pruefeDaten({ ...beispiel(), schemaVersion: 2 })).toBeNull();
    expect(pruefeDaten({ ...beispiel(), sitzungen: [{ id: 1 }] })).toBeNull();
    expect(pruefeDaten(beispiel())).toEqual(beispiel());
  });

  it("Export → Import ergibt identische Daten und setzt letzteSicherung", () => {
    const { json, daten, dateiname } = exportiere(beispiel(), jetzt);
    expect(daten.letzteSicherung).toBe(jetzt.toISOString());
    expect(dateiname).toBe("lesestart-sicherung-2026-10-08.json");
    expect(importiere(json)).toEqual({ ok: true, daten });
  });

  it("ungültiger Import liefert Fehler", () => {
    expect(importiere("kein json").ok).toBe(false);
    expect(importiere(JSON.stringify({ hallo: "welt" })).ok).toBe(false);
  });

  it("Sicherung nach 14 Tagen fällig", () => {
    const d = leereDaten(new Date(2026, 8, 20));
    expect(sicherungFaellig(d, new Date(2026, 9, 3))).toBe(false);
    expect(sicherungFaellig(d, new Date(2026, 9, 5))).toBe(true);
    expect(sicherungFaellig({ ...d, letzteSicherung: new Date(2026, 9, 1).toISOString() }, new Date(2026, 9, 8))).toBe(false);
  });
});
