import { describe, expect, it } from "vitest";
import { inhalte } from "../content";
import { erzeugeBildsatz, erzeugeBildsaetze, nutzbareSchablonen } from "./bildsaetze";
import { elementIstLesbar } from "./bausteine";
import { erzeugeRng } from "./rng";
import { testKontext } from "./test-hilfen";

const ids = (k: Parameters<typeof nutzbareSchablonen>[0]) => nutzbareSchablonen(k).map((s) => s.id).sort();

describe("Bildsätze", () => {
  it("mit M, I, A nur die im/am-Schablonen", () => {
    expect(ids(testKontext(["m", "i", "a"]))).toEqual(["name-am", "name-im"]);
  });

  it("schaltet Schablonen mit neuen Buchstaben frei", () => {
    const k = testKontext(["m", "i", "a", "l", "t", "o", "s"]);
    expect(ids(k)).toEqual(["name-am", "name-im", "name-malt", "oma-ist-im"]);
  });

  it("ohne lesbaren Namen keine [Name]-Schablonen", () => {
    const ohneNamen = { ...inhalte, woerter: inhalte.woerter.filter((w) => w.typ !== "name") };
    expect(ids(testKontext(["m", "i", "a"], { inhalte: ohneNamen }))).toEqual([]);
  });

  it("ohne passendes Bild ist die Schablone nicht nutzbar", () => {
    const ohneAm = { ...inhalte, bilder: inhalte.bilder.filter((b) => !b.etiketten.includes("Ort-am")) };
    expect(ids(testKontext(["m", "i", "a"], { inhalte: ohneAm }))).toEqual(["name-im"]);
  });

  it("erzeugt lesbare Sätze mit passendem Bild und großem Anfang", () => {
    const k = testKontext(["m", "i", "a"]);
    const schablone = inhalte.schablonen.find((s) => s.id === "name-im")!;
    for (let s = 0; s < 100; s++) {
      const satz = erzeugeBildsatz(k, erzeugeRng(s), schablone);
      expect(satz.typ).toBe("satz");
      expect(elementIstLesbar(satz, k)).toBe(true);
      const bild = satz.teile!.find((t) => t.art === "bild")!;
      if (bild.art !== "bild") throw new Error("kein Bild");
      const eintrag = inhalte.bilder.find((b) => b.emoji === bild.emoji)!;
      expect(eintrag.etiketten).toContain("Ort-im");
      expect(satz.text[0]).toBe(satz.text[0].toUpperCase());
      expect(satz.text).toContain(bild.emoji);
    }
  });

  it("schreibt feste Wörter am Satzanfang groß", () => {
    const k = testKontext(["m", "i", "a", "l", "t", "o", "s"]);
    const schablone = inhalte.schablonen.find((s) => s.id === "oma-ist-im")!;
    expect(erzeugeBildsatz(k, erzeugeRng(1), schablone).text.startsWith("Oma ist im ")).toBe(true);
  });

  it("erzeugeBildsaetze liefert eindeutige Sätze", () => {
    const saetze = erzeugeBildsaetze(testKontext(["m", "i", "a"]), erzeugeRng(2), 5);
    expect(saetze).toHaveLength(5);
    expect(new Set(saetze.map((s) => s.text)).size).toBe(5);
  });

  it("erzeugeBildsaetze liefert [] ohne nutzbare Schablone", () => {
    expect(erzeugeBildsaetze(testKontext(["o"]), erzeugeRng(2), 5)).toEqual([]);
  });
});
