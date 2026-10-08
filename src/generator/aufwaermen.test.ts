import { describe, expect, it } from "vitest";
import { AUFWAERM_ANZAHL, erzeugeAufwaermen } from "./aufwaermen";
import { elementIstLesbar } from "./bausteine";
import { erzeugeRng } from "./rng";
import { testKontext } from "./test-hilfen";

describe("Aufwärmen", () => {
  it("liefert 8 eindeutige, lesbare Elemente ohne Einzelbuchstaben", () => {
    const k = testKontext(["m", "i", "a", "l", "o"]);
    const els = erzeugeAufwaermen(k, erzeugeRng(1));
    expect(els).toHaveLength(AUFWAERM_ANZAHL);
    expect(new Set(els.map((e) => e.text.toLowerCase())).size).toBe(AUFWAERM_ANZAHL);
    for (const el of els) {
      expect(el.typ).not.toBe("buchstabe");
      expect(elementIstLesbar(el, k)).toBe(true);
    }
  });

  it("plant die Wiederholungen bevorzugt ein (4 Plätze)", () => {
    const wiederholungen = ["Mimi", "Mama", "Lama", "Olli", "Mali", "Lio"].map((text) => ({
      typ: "wort" as const, text,
    }));
    const k = testKontext(["m", "i", "a", "l", "o"], { wiederholungen });
    const els = erzeugeAufwaermen(k, erzeugeRng(2));
    const anzahl = els.filter((e) => wiederholungen.some((w) => w.text === e.text)).length;
    expect(anzahl).toBeGreaterThanOrEqual(4);
    expect(els).toHaveLength(8);
  });

  it("lässt unlesbar gewordene Wiederholungen weg (Buchstabe abgewählt)", () => {
    const k = testKontext(["m", "i", "a"], { wiederholungen: [{ typ: "wort", text: "Oma" }] });
    for (let s = 0; s < 50; s++) {
      expect(erzeugeAufwaermen(k, erzeugeRng(s)).map((e) => e.text)).not.toContain("Oma");
    }
  });

  it("kommt mit sehr wenig Material aus", () => {
    const els = erzeugeAufwaermen(testKontext(["m", "a"]), erzeugeRng(3));
    expect(els.length).toBeGreaterThan(0);
    expect(els.length).toBeLessThanOrEqual(8);
    expect(new Set(els.map((e) => e.text.toLowerCase())).size).toBe(els.length);
  });
});
