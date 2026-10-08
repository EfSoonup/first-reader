import { describe, expect, it } from "vitest";
import { inhalte } from "../content";
import { grossschreiben, istGesperrt, istLesbar, zerlege } from "./grapheme";

const inv = inhalte.inventar;

describe("zerlege", () => {
  it.each([
    ["Mama", ["m", "a", "m", "a"]],
    ["Schule", ["sch", "u", "l", "e"]],
    ["Eis", ["ei", "s"]],
    ["Stein", ["st", "ei", "n"]],
    ["Mist", ["m", "i", "s", "t"]],
    ["ist", ["i", "s", "t"]],
    ["Bäcker", ["b", "ä", "ck", "e", "r"]],
    ["MAMA", ["m", "a", "m", "a"]],
  ])("%s", (text, erwartet) => {
    expect(zerlege(text, inv)).toEqual(erwartet);
  });

  it("nutzt eine explizite Zerlegung", () => {
    const ex = ["f", "a", "m", "i", "l", "i", "e"];
    expect(zerlege("Familie", inv, ex)).toEqual(ex);
    expect(zerlege("Familie", inv)?.at(-1)).toBe("ie");
  });

  it("lehnt explizite Zerlegung ab, die nicht zum Text passt", () => {
    expect(zerlege("Mama", inv, ["m", "a"])).toBeNull();
  });

  it("liefert null bei unbekannten Zeichen", () => {
    expect(zerlege("Pizza1", inv)).toBeNull();
    expect(zerlege("", inv)).toBeNull();
  });
});

describe("istLesbar", () => {
  it("prüft gegen bekannte Grapheme, unabhängig von Groß/klein", () => {
    const bekannt = new Set(["m", "i", "a"]);
    expect(istLesbar("Mia", bekannt, inv)).toBe(true);
    expect(istLesbar("MAMA", bekannt, inv)).toBe(true);
    expect(istLesbar("Oma", bekannt, inv)).toBe(false);
  });

  it("verlangt Mehrbuchstaben-Grapheme", () => {
    expect(istLesbar("Schaf", new Set(["s", "c", "h", "a", "f"]), inv)).toBe(false);
    expect(istLesbar("Schaf", new Set(["sch", "a", "f"]), inv)).toBe(true);
  });
});

describe("grossschreiben", () => {
  it.each([["sch", "Sch"], ["ei", "Ei"], ["ma", "Ma"], ["ß", "ß"], ["", ""]])("%s", (ein, aus) => {
    expect(grossschreiben(ein)).toBe(aus);
  });
});

describe("istGesperrt", () => {
  it("findet Sperrwörter als Teilstring, unabhängig von Groß/klein", () => {
    expect(istGesperrt("Kacka", ["kack"])).toBe(true);
    expect(istGesperrt("Mimi", ["kack"])).toBe(false);
  });
});
