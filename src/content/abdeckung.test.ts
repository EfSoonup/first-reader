import { describe, expect, it } from "vitest";
import { testInhalte } from "../generator/test-inhalte";
import { abdeckung, REIHENFOLGEN, vollstaendig } from "./abdeckung";
import { inhalte } from "./index";

describe("Abdeckung", () => {
  it("zählt pro Schritt lesbare Wörter, Namen, abbildbare Wörter und Schablonen (Fixture)", () => {
    const schritte = abdeckung(["m", "i", "a"], testInhalte);
    expect(schritte[2]).toEqual({
      anzahl: 3, graphem: "a", woerter: 6, namen: 4, abbildbar: 1, bonusFrei: false, schablonen: 2,
    });
    expect(schritte).toHaveLength(testInhalte.inventar.length);
  });

  it("hängt fehlende Grapheme hinten an", () => {
    expect(vollstaendig(["m", "a"], inhalte).slice(0, 2)).toEqual(["m", "a"]);
    expect(new Set(vollstaendig(["m", "a"], inhalte)).size).toBe(inhalte.inventar.length);
  });

  describe.each(REIHENFOLGEN)("mitgelieferter Content, Reihenfolge $name", ({ grapheme }) => {
    const schritte = abdeckung(grapheme, inhalte);
    it("ab 4 Buchstaben ≥ 10 lesbare Wörter und ≥ 1 Schablone", () => {
      for (const s of schritte.slice(3)) {
        expect(s.woerter, `nach ${s.graphem}`).toBeGreaterThanOrEqual(10);
        expect(s.schablonen, `nach ${s.graphem}`).toBeGreaterThanOrEqual(1);
      }
    });
    it("Bonusspiel spätestens ab 8 Buchstaben frei", () => {
      for (const s of schritte.slice(7)) expect(s.bonusFrei, `nach ${s.graphem}`).toBe(true);
    });
  });
});
