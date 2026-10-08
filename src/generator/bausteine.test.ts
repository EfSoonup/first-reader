import { describe, expect, it } from "vitest";
import {
  buchstabenElemente, elementIstLesbar, geschlosseneSilben, offeneSilben, woerterAlsElemente,
} from "./bausteine";
import { testKontext } from "./test-hilfen";

const texte = (els: { text: string }[]) => els.map((e) => e.text).sort();

describe("bausteine", () => {
  it("Buchstaben groß und klein", () => {
    expect(texte(buchstabenElemente(testKontext(["m", "i", "a"])))).toEqual(
      ["A", "I", "M", "a", "i", "m"],
    );
  });

  it("ß nur klein, sch als Sch", () => {
    expect(texte(buchstabenElemente(testKontext(["ß", "sch"])))).toEqual(["Sch", "sch", "ß"]);
  });

  it("offene und geschlossene Silben aus M, I, A", () => {
    const k = testKontext(["m", "i", "a"]);
    expect(texte(offeneSilben(k))).toEqual(["ma", "mi"]);
    expect(texte(geschlosseneSilben(k))).toEqual(["am", "im"]);
    expect(offeneSilben(k).every((e) => e.typ === "silbe")).toBe(true);
  });

  it("ck nicht am Anfang, st nur am Anfang", () => {
    expect(texte(offeneSilben(testKontext(["a", "ck"])))).toEqual([]);
    expect(texte(geschlosseneSilben(testKontext(["a", "ck"])))).toEqual(["ack"]);
    expect(texte(offeneSilben(testKontext(["a", "st"])))).toEqual(["sta"]);
    expect(texte(geschlosseneSilben(testKontext(["a", "st"])))).toEqual([]);
  });

  it("c, x, y erzeugen keine Silben", () => {
    expect(offeneSilben(testKontext(["a", "c", "x", "y"]))).toEqual([]);
  });

  it("nur lesbare Wörter aus der Wortliste", () => {
    expect(texte(woerterAlsElemente(testKontext(["m", "i", "a"])))).toEqual(
      ["Mama", "Mami", "Mia", "Mimi", "am", "im"],
    );
    expect(texte(woerterAlsElemente(testKontext(["m", "a"])))).toEqual(["Mama", "am"]);
  });

  it("elementIstLesbar prüft bei Sätzen nur die Textteile", () => {
    const k = testKontext(["m", "i", "a"]);
    const satz = {
      typ: "satz" as const,
      text: "Mia im 🚂",
      teile: [
        { art: "text" as const, text: "Mia" },
        { art: "text" as const, text: "im" },
        { art: "bild" as const, emoji: "🚂", wort: "Zug" },
      ],
    };
    expect(elementIstLesbar(satz, k)).toBe(true);
    expect(elementIstLesbar({ typ: "wort", text: "Oma" }, k)).toBe(false);
  });
});
