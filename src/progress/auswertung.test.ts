import { describe, expect, it } from "vitest";
import {
  leseKette, protokoll, tageswerte, tagSchluessel, wochenSmileys, wochentage, wochenUebersicht, zielErreicht,
} from "./auswertung";
import type { Sitzung } from "./typen";

// 2026-10-08 ist ein Donnerstag. Lokale Zeiten → zeitzonenunabhängig.
const am = (tag: number, stunde = 10) => new Date(2026, 9, tag, stunde, 0, 0);
const sitzung = (tag: number, minuten: number, richtig = 10, stunde = 10): Sitzung => ({
  id: `${tag}-${stunde}`,
  start: am(tag, stunde).toISOString(),
  ende: am(tag, stunde).toISOString(),
  aktiveSekunden: minuten * 60,
  richtig,
  fehlversuche: 1,
  gezeigteElemente: [],
});

describe("Auswertung", () => {
  it("tagSchluessel nutzt das lokale Datum", () => {
    expect(tagSchluessel(am(8))).toBe("2026-10-08");
    expect(tagSchluessel(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("summiert mehrere Sitzungen eines Tages", () => {
    const w = tageswerte([sitzung(8, 4, 10, 9), sitzung(8, 7, 20, 17), sitzung(7, 30)], "2026-10-08");
    expect(w).toEqual({ tag: "2026-10-08", aktiveSekunden: 660, richtig: 30, fehlversuche: 2 });
    expect(zielErreicht(w, 10)).toBe(true);
    expect(zielErreicht(w, 12)).toBe(false);
  });

  it("Protokoll: ein Eintrag pro Tag, neueste zuerst", () => {
    const p = protokoll([sitzung(6, 12), sitzung(8, 3), sitzung(8, 3, 5, 15)], 10);
    expect(p.map((z) => [z.tag, z.zielErreicht])).toEqual([["2026-10-08", false], ["2026-10-06", true]]);
  });

  it("Wochentage Mo–So", () => {
    expect(wochentage(am(8))).toEqual([
      "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11",
    ]);
    expect(wochentage(new Date(2026, 9, 11))[0]).toBe("2026-10-05"); // Sonntag gehört zur selben Woche
  });

  it("Wochen-Smileys und -Übersicht", () => {
    const s = [sitzung(5, 10), sitzung(7, 15), sitzung(8, 5)];
    expect(wochenSmileys(s, am(8), 10)).toEqual([true, false, true, false, false, false, false]);
    expect(wochenUebersicht(s, am(8), 10)[2]).toMatchObject({ tag: "2026-10-07", aktiveSekunden: 900, zielErreicht: true });
  });

  it("Lese-Kette zählt zurück ab heute bzw. gestern", () => {
    const s = [sitzung(4, 10), sitzung(6, 10), sitzung(7, 10)];
    expect(leseKette(s, am(8), 10)).toBe(2);                       // heute noch offen → ab gestern
    expect(leseKette([...s, sitzung(8, 10)], am(8), 10)).toBe(3);  // heute erreicht
    expect(leseKette([sitzung(5, 10)], am(8), 10)).toBe(0);        // Kette gerissen
  });
});
