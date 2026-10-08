import { describe, expect, it } from "vitest";
import { testInhalte as inhalte } from "./test-inhalte";
import { zerlege } from "./grapheme";
import { erzeugePseudowoerter, erzeugePseudowort } from "./pseudowoerter";
import { erzeugeRng } from "./rng";
import { testKontext } from "./test-hilfen";

function viele(bekannt: string[], seeds = 300, extra = {}) {
  const k = testKontext(bekannt, extra);
  const ergebnis = [];
  for (let s = 0; s < seeds; s++) {
    const el = erzeugePseudowort(k, erzeugeRng(s));
    if (el) ergebnis.push(el);
  }
  return ergebnis;
}

describe("Pseudowörter", () => {
  it("bestehen nur aus bekannten Graphemen und sind großgeschrieben", () => {
    const bekannt = ["m", "i", "a"];
    const els = viele(bekannt);
    expect(els.length).toBeGreaterThan(250);
    for (const el of els) {
      const z = zerlege(el.text, inhalte.inventar)!;
      expect(z.every((g) => bekannt.includes(g))).toBe(true);
      if (el.typ === "pseudowort") expect(el.text[0]).toBe(el.text[0].toUpperCase());
    }
  });

  it("haben höchstens 2 Silben (≤ 5 Grapheme), solange < 10 Grapheme bekannt sind", () => {
    for (const el of viele(["m", "i", "a", "l", "o"])) {
      expect(zerlege(el.text, inhalte.inventar)!.length).toBeLessThanOrEqual(5);
    }
  });

  it("haben ab 10 Graphemen auch 3 Silben und höchstens 2 Konsonanten in Folge", () => {
    const bekannt = ["m", "i", "a", "l", "o", "t", "n", "e", "s", "r", "u", "f"];
    const typ = new Map(inhalte.inventar.map((i) => [i.g, i.typ]));
    const els = viele(bekannt, 500);
    expect(els.some((el) => zerlege(el.text, inhalte.inventar)!.length > 5)).toBe(true);
    for (const el of els) {
      const folge = zerlege(el.text, inhalte.inventar)!.map((g) => typ.get(g)).join(",");
      expect(folge).not.toContain("konsonant,konsonant,konsonant");
    }
  });

  it("bilden keine ungewollten Mehrbuchstaben-Grapheme (e+i → ei)", () => {
    const bekannt = ["m", "e", "i"];
    for (const el of viele(bekannt, 500)) {
      const z = zerlege(el.text, inhalte.inventar)!;
      expect(z.every((g) => bekannt.includes(g))).toBe(true);
    }
  });

  it("bilden kein s+ch → sch", () => {
    const bekannt = ["s", "ch", "a", "m", "i", "o", "l", "t", "n", "e"];
    for (const el of viele(bekannt, 500)) {
      const z = zerlege(el.text, inhalte.inventar)!;
      expect(z.every((g) => bekannt.includes(g))).toBe(true);
    }
  });

  it("respektieren die Sperrliste", () => {
    for (const el of viele(["m", "i", "a"], 300, { inhalte: { ...inhalte, sperrliste: ["mim"] } })) {
      expect(el.text.toLowerCase()).not.toContain("mim");
    }
  });

  it("behandeln Treffer in der Wortliste als echtes Wort", () => {
    const mama = viele(["m", "a"], 500).filter((e) => e.text.toLowerCase() === "mama");
    expect(mama.length).toBeGreaterThan(0);
    for (const el of mama) expect(el).toEqual({ typ: "wort", text: "Mama" });
  });

  it("liefern nichts ohne Vokal", () => {
    expect(erzeugePseudowort(testKontext(["m", "l"]), erzeugeRng(1))).toBeNull();
    expect(erzeugePseudowoerter(testKontext(["m", "l"]), erzeugeRng(1), 5)).toEqual([]);
  });

  it("erzeugePseudowoerter liefert eindeutige Texte", () => {
    const els = erzeugePseudowoerter(testKontext(["m", "i", "a", "l", "o"]), erzeugeRng(4), 15);
    expect(els.length).toBe(15);
    expect(new Set(els.map((e) => e.text.toLowerCase())).size).toBe(15);
  });

  it("verdoppeln keinen Vokal (kein „Maa“: ungelernter langer Vokal)", () => {
    const vokal = new Set(inhalte.inventar.filter((i) => i.typ === "vokal").map((i) => i.g));
    for (const bekannt of [["m", "i", "a"], ["m", "a"], ["sch", "a", "ei", "m"]]) {
      for (const el of viele(bekannt, 500)) {
        const z = zerlege(el.text, inhalte.inventar)!;
        for (let i = 1; i < z.length; i++) {
          if (vokal.has(z[i])) expect(z[i], el.text).not.toBe(z[i - 1]);
        }
      }
    }
  });
});
