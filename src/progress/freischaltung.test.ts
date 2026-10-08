import { describe, expect, it } from "vitest";
import { bekannteGrapheme, erledigeFeier, neueGrapheme, schalteUm } from "./freischaltung";
import { leereDaten } from "./typen";

describe("Freischaltung", () => {
  it("schaltet ein und merkt die Feier vor", () => {
    const jetzt = new Date(2026, 9, 8);
    const d = schalteUm(leereDaten(jetzt), "l", jetzt);
    expect([...bekannteGrapheme(d)]).toEqual(["l"]);
    expect(d.spielstand.offeneFeier).toEqual(["l"]);
  });

  it("schaltet wieder aus und entfernt die offene Feier", () => {
    const jetzt = new Date(2026, 9, 8);
    const d = schalteUm(schalteUm(leereDaten(jetzt), "l", jetzt), "l", jetzt);
    expect(bekannteGrapheme(d).size).toBe(0);
    expect(d.spielstand.offeneFeier).toEqual([]);
  });

  it("neu sind Grapheme der letzten 7 Tage", () => {
    let d = leereDaten(new Date(2026, 9, 1));
    d = schalteUm(d, "m", new Date(2026, 8, 20));
    d = schalteUm(d, "l", new Date(2026, 9, 5));
    expect([...neueGrapheme(d, new Date(2026, 9, 8))]).toEqual(["l"]);
  });

  it("erledigeFeier entfernt genau ein Graphem", () => {
    const jetzt = new Date(2026, 9, 8);
    let d = schalteUm(schalteUm(leereDaten(jetzt), "l", jetzt), "t", jetzt);
    d = erledigeFeier(d, "l");
    expect(d.spielstand.offeneFeier).toEqual(["t"]);
  });
});
