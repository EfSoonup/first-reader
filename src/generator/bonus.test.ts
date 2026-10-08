import { describe, expect, it } from "vitest";
import { testInhalte as inhalte } from "./test-inhalte";
import { BONUS_RUNDEN, erzeugeBonus } from "./bonus";
import { erzeugeRng } from "./rng";
import { testKontext } from "./test-hilfen";

const mitBildwoertern = {
  ...inhalte,
  woerter: [
    ...inhalte.woerter,
    { text: "Oma", typ: "name" as const, emoji: "👵", kategorie: "Familie" },
    { text: "Lama", typ: "wort" as const, emoji: "🦙", kategorie: "Tiere" },
    { text: "Mais", typ: "wort" as const, emoji: "🌽", kategorie: "Essen" },
  ],
};

describe("Bonusspiel", () => {
  it("ist gesperrt mit weniger als 4 abbildbaren Wörtern", () => {
    expect(erzeugeBonus(testKontext(["m", "i", "a"]), erzeugeRng(1))).toBeNull();
  });

  it("liefert 6 Runden mit je 3 Bildern und genau einer richtigen Antwort", () => {
    const k = testKontext(["m", "a", "o", "l", "i", "s"], { inhalte: mitBildwoertern });
    const runden = erzeugeBonus(k, erzeugeRng(2))!;
    expect(runden).toHaveLength(BONUS_RUNDEN);
    for (const runde of runden) {
      expect(runde.optionen).toHaveLength(3);
      expect(new Set(runde.optionen.map((o) => o.emoji)).size).toBe(3);
      const richtig = runde.optionen.filter((o) => o.richtig);
      expect(richtig).toHaveLength(1);
      const eintrag = mitBildwoertern.woerter.find((w) => w.text === runde.wort)!;
      expect(richtig[0].emoji).toBe(eintrag.emoji);
    }
  });

  it("wählt Ablenker aus anderen Kategorien", () => {
    const k = testKontext(["m", "a", "o", "l", "i", "s"], { inhalte: mitBildwoertern });
    const kategorie = new Map<string, string>([
      ...mitBildwoertern.bilder.map((b) => [b.emoji, b.kategorie] as [string, string]),
      ...mitBildwoertern.woerter.filter((w) => w.emoji).map((w) => [w.emoji!, w.kategorie!] as [string, string]),
    ]);
    for (const runde of erzeugeBonus(k, erzeugeRng(3))!) {
      const ziel = runde.optionen.find((o) => o.richtig)!;
      for (const o of runde.optionen.filter((o) => !o.richtig)) {
        expect(kategorie.get(o.emoji)).not.toBe(kategorie.get(ziel.emoji));
      }
    }
  });
});
