import { describe, expect, it } from "vitest";
import { enthaeltNeuesGraphem, gewicht, gewichteteElemente } from "./gewichtung";
import { erzeugeRng } from "./rng";
import { testKontext } from "./test-hilfen";
import type { LeseElement } from "./typen";

const mi: LeseElement = { typ: "silbe", text: "mi" };
const ma: LeseElement = { typ: "silbe", text: "ma" };

describe("Gewichtung", () => {
  it("erkennt neue Grapheme", () => {
    const k = testKontext(["m", "i", "a"], { neu: new Set(["i"]) });
    expect(enthaeltNeuesGraphem(mi, k)).toBe(true);
    expect(enthaeltNeuesGraphem(ma, k)).toBe(false);
  });

  it("berechnet Gewichte", () => {
    const k = testKontext(["m", "i", "a"], { neu: new Set(["i"]), kuerzlich: new Set(["mi", "ma"]) });
    expect(gewicht(mi, k)).toBeCloseTo(0.3);
    expect(gewicht(ma, k)).toBeCloseTo(0.1);
    expect(gewicht(ma, testKontext(["m", "i", "a"]))).toBe(1);
  });

  it("zieht neue Grapheme häufiger", () => {
    const k = testKontext(["m", "i", "a"], { neu: new Set(["i"]) });
    const rng = erzeugeRng(11);
    let treffer = 0;
    for (let i = 0; i < 2000; i++) {
      if (gewichteteElemente(k, rng, [mi, ma], 1)[0].text === "mi") treffer++;
    }
    expect(treffer / 2000).toBeGreaterThan(0.65);
  });

  it("zieht kürzlich Gezeigtes seltener", () => {
    const k = testKontext(["m", "i", "a"], { kuerzlich: new Set(["mi"]) });
    const rng = erzeugeRng(12);
    let treffer = 0;
    for (let i = 0; i < 2000; i++) {
      if (gewichteteElemente(k, rng, [mi, ma], 1)[0].text === "mi") treffer++;
    }
    expect(treffer / 2000).toBeLessThan(0.2);
  });
});
