import { describe, expect, it } from "vitest";
import { erzeugeRng, gewichteteAuswahl, mische, waehle } from "./rng";

describe("rng", () => {
  it("liefert bei gleichem Seed dieselbe Folge", () => {
    const a = erzeugeRng(42);
    const b = erzeugeRng(42);
    const folgeA = Array.from({ length: 5 }, () => a.next());
    const folgeB = Array.from({ length: 5 }, () => b.next());
    expect(folgeA).toEqual(folgeB);
  });

  it("liefert bei anderem Seed eine andere Folge", () => {
    expect(erzeugeRng(1).next()).not.toEqual(erzeugeRng(2).next());
  });

  it("liefert Werte in [0, 1)", () => {
    const rng = erzeugeRng(7);
    for (let i = 0; i < 1000; i++) {
      const x = rng.next();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it("mische ist eine Permutation und verändert das Original nicht", () => {
    const original = [1, 2, 3, 4, 5];
    const ergebnis = mische(erzeugeRng(3), original);
    expect([...ergebnis].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(original).toEqual([1, 2, 3, 4, 5]);
  });

  it("waehle wirft bei leerer Liste", () => {
    expect(() => waehle(erzeugeRng(1), [])).toThrow();
  });

  it("gewichteteAuswahl zieht ohne Zurücklegen", () => {
    const eintraege = ["a", "b", "c"].map((wert) => ({ wert, gewicht: 1 }));
    const ergebnis = gewichteteAuswahl(erzeugeRng(5), eintraege, 10);
    expect([...ergebnis].sort()).toEqual(["a", "b", "c"]);
  });

  it("gewichteteAuswahl bevorzugt schwere Einträge", () => {
    const rng = erzeugeRng(9);
    const eintraege = [{ wert: "schwer", gewicht: 9 }, { wert: "leicht", gewicht: 1 }];
    let schwer = 0;
    for (let i = 0; i < 1000; i++) {
      if (gewichteteAuswahl(rng, eintraege, 1)[0] === "schwer") schwer++;
    }
    expect(schwer).toBeGreaterThan(800);
  });
});
