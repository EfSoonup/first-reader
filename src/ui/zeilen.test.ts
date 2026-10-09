import { describe, expect, it } from "vitest";
import type { Leseblatt, LeseElement, Zeile } from "../generator/typen";
import { teileZeilen } from "./zeilen";

const el = (text: string): LeseElement => ({ text, typ: "silbe" });
const zeile = (art: Zeile["art"], n: number, stern = false): Zeile =>
  ({ art, stern, elemente: Array.from({ length: n }, (_, i) => el(`${art}${i}`)) });
const laengen = (b: Leseblatt) => b.zeilen.map((z) => `${z.art}:${z.elemente.length}`);
const hoechstens = (n: number) => (elemente: LeseElement[]) => elemente.length <= n;

describe("teileZeilen", () => {
  const blatt: Leseblatt = {
    zeilen: [zeile("buchstaben", 8), zeile("silben", 8), zeile("woerter", 6), zeile("woerter", 4), zeile("saetze", 1, true)],
  };

  it("lässt Zeilen, die passen, unverändert", () => {
    expect(teileZeilen(blatt, () => true)).toEqual(blatt);
  });

  it("teilt so wenig wie nötig und gleichmäßig, Reihenfolge, Art und Stern bleiben", () => {
    const geteilt = teileZeilen(blatt, hoechstens(3));
    expect(laengen(geteilt)).toEqual([
      "buchstaben:3", "buchstaben:3", "buchstaben:2",
      "silben:3", "silben:3", "silben:2",
      "woerter:3", "woerter:3",
      "woerter:2", "woerter:2",
      "saetze:1",
    ]);
    expect(geteilt.zeilen.at(-1)!.stern).toBe(true);
    const texte = (b: Leseblatt) => b.zeilen.flatMap((z) => z.elemente.map((e) => e.text));
    expect(texte(geteilt)).toEqual(texte(blatt));
  });

  it("halbiert lieber, als einen Einzelgänger übrig zu lassen", () => {
    expect(laengen(teileZeilen({ zeilen: [zeile("silben", 8)] }, hoechstens(7)))).toEqual(["silben:4", "silben:4"]);
  });

  it("nimmt mehr Teile, wenn ein langes Element ein Stück sprengt", () => {
    const lang = el("Dodiedied");
    const z: Zeile = { art: "woerter", stern: false, elemente: [el("a"), el("b"), lang, el("c")] };
    const passt = (elemente: LeseElement[]) => elemente.length <= 2 && !(elemente.includes(lang) && elemente.length > 1);
    expect(teileZeilen({ zeilen: [z] }, passt).zeilen.map((x) => x.elemente.map((e) => e.text)))
      .toEqual([["a", "b"], ["Dodiedied"], ["c"]]);
  });

  it("teilt Satzzeilen nie", () => {
    expect(teileZeilen({ zeilen: [zeile("saetze", 1, true)] }, () => false).zeilen).toHaveLength(1);
  });
});
