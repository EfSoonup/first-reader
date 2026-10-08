import { describe, expect, it } from "vitest";
import { elementIstLesbar } from "./bausteine";
import { buchstabenZeilenAnzahl, erzeugeLeseblatt } from "./leseblatt";
import { erzeugeRng } from "./rng";
import { testKontext } from "./test-hilfen";

const arten = (bekannt: string[], seed = 1) =>
  erzeugeLeseblatt(testKontext(bekannt), erzeugeRng(seed)).zeilen.map((z) => z.art);

describe("Leseblatt", () => {
  it("Buchstabenzeilen je nach Stand", () => {
    expect(buchstabenZeilenAnzahl(3)).toBe(2);
    expect(buchstabenZeilenAnzahl(5)).toBe(1);
    expect(buchstabenZeilenAnzahl(6)).toBe(0);
  });

  it("Aufbau mit M, I, A wie das Schulblatt", () => {
    expect(arten(["m", "i", "a"])).toEqual([
      "buchstaben", "buchstaben", "silben", "silben",
      "woerter", "woerter", "woerter",
      "saetze", "saetze", "saetze", "saetze",
    ]);
  });

  it("ohne Buchstabenzeilen ab 6 Graphemen", () => {
    expect(arten(["m", "i", "a", "l", "o", "t"])).not.toContain("buchstaben");
  });

  it("Silbenzeilen: 8 Elemente, nie zweimal dasselbe direkt hintereinander", () => {
    for (let s = 0; s < 30; s++) {
      const blatt = erzeugeLeseblatt(testKontext(["m", "i", "a"]), erzeugeRng(s));
      for (const zeile of blatt.zeilen.filter((z) => z.art === "silben")) {
        expect(zeile.elemente).toHaveLength(8);
        for (let i = 1; i < zeile.elemente.length; i++) {
          expect(zeile.elemente[i].text.toLowerCase()).not.toBe(zeile.elemente[i - 1].text.toLowerCase());
        }
      }
    }
  });

  it("Wörter sind pro Blatt eindeutig und enthalten die echten Wörter", () => {
    const blatt = erzeugeLeseblatt(testKontext(["m", "i", "a"]), erzeugeRng(5));
    const woerter = blatt.zeilen.filter((z) => z.art === "woerter").flatMap((z) => z.elemente);
    expect(new Set(woerter.map((w) => w.text.toLowerCase())).size).toBe(woerter.length);
    expect(woerter.map((w) => w.text)).toEqual(expect.arrayContaining(["Mama", "Mia", "Mimi", "Mami"]));
    for (const z of blatt.zeilen.filter((z) => z.art === "woerter")) expect(z.elemente.length).toBeLessThanOrEqual(6);
  });

  it("Satzzeilen haben Stern und genau einen Satz", () => {
    const blatt = erzeugeLeseblatt(testKontext(["m", "i", "a"]), erzeugeRng(6));
    for (const z of blatt.zeilen.filter((z) => z.art === "saetze")) {
      expect(z.stern).toBe(true);
      expect(z.elemente).toHaveLength(1);
      expect(z.elemente[0].typ).toBe("satz");
    }
  });

  it("alle Elemente sind lesbar", () => {
    const k = testKontext(["m", "i", "a", "l", "o", "t", "n"]);
    for (let s = 0; s < 30; s++) {
      for (const z of erzeugeLeseblatt(k, erzeugeRng(s)).zeilen) {
        for (const el of z.elemente) expect(elementIstLesbar(el, k)).toBe(true);
      }
    }
  });

  it("winzige Buchstabenmenge (m, a) liefert ein kurzes, gültiges Blatt", () => {
    const blatt = erzeugeLeseblatt(testKontext(["m", "a"]), erzeugeRng(7));
    expect(blatt.zeilen.length).toBeGreaterThan(0);
  });
});
