import { describe, expect, it } from "vitest";
import { inhalte } from "../content";
import { schalteUm } from "./freischaltung";
import { baueKontext } from "./kontext";
import { leereDaten, type Sitzung } from "./typen";

const sitzung = (id: string, tag: number, gezeigt: string[]): Sitzung => {
  const iso = new Date(2026, 9, tag).toISOString();
  return { id, start: iso, ende: iso, aktiveSekunden: 0, richtig: 0, fehlversuche: 0, gezeigteElemente: gezeigt };
};

describe("baueKontext", () => {
  it("übernimmt bekannte/neue Grapheme, Wiederholungen und die letzten 2 Sitzungen", () => {
    const jetzt = new Date(2026, 9, 8);
    let d = schalteUm(leereDaten(jetzt), "m", new Date(2026, 8, 1));
    d = schalteUm(d, "a", jetzt);
    d = {
      ...d,
      sitzungen: [sitzung("1", 5, ["alt"]), sitzung("2", 6, ["mi"]), sitzung("3", 7, ["ma"])],
      wiederholungen: [{ text: "Mama", typ: "wort", richtigInFolge: 1 }],
    };
    const k = baueKontext(d, inhalte, jetzt);
    expect([...k.bekannt].sort()).toEqual(["a", "m"]);
    expect([...k.neu]).toEqual(["a"]);
    expect([...k.kuerzlich].sort()).toEqual(["ma", "mi"]);
    expect(k.wiederholungen).toEqual([{ text: "Mama", typ: "wort" }]);
    expect(k.inhalte).toBe(inhalte);
  });
});
