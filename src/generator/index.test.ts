import { describe, expect, it } from "vitest";
import { inhalte } from "../content";
import { elementIstLesbar } from "./bausteine";
import { generiere, pruefeBuchstabenStand, zaehleWoerterMitGraphem } from "./index";
import { erzeugeRng, mische } from "./rng";
import { testKontext } from "./test-hilfen";

describe("generiere", () => {
  it("ist bei gleichem Seed reproduzierbar", () => {
    const k = testKontext(["m", "i", "a", "l", "o"]);
    expect(generiere(k, 99)).toEqual(generiere(k, 99));
  });

  it("Kernregel: kein Element enthält ein unbekanntes Graphem", () => {
    const alle = inhalte.inventar.map((i) => i.g);
    let geprueft = 0;
    for (let seed = 0; seed < 300; seed++) {
      const rng = erzeugeRng(seed * 7919);
      const anzahl = 2 + Math.floor(rng.next() * 19);
      const k = testKontext(mische(rng, alle).slice(0, anzahl), { inhalte }); // echter Content
      if (!pruefeBuchstabenStand(k).ok) continue;
      geprueft++;
      const material = generiere(k, seed);
      const elemente = [
        ...material.aufwaermen,
        ...material.leseblatt.zeilen.flatMap((z) => z.elemente),
        ...(material.bonus ?? []).map((r) => ({ typ: "wort" as const, text: r.wort })),
      ];
      for (const el of elemente) {
        if (!elementIstLesbar(el, k)) {
          throw new Error(`Unlesbar: "${el.text}" bei ${[...k.bekannt].join(",")}`);
        }
      }
    }
    expect(geprueft).toBeGreaterThan(150);
  });

  it("ist auch mit allen Graphemen und dem echten Content schnell (< 50 ms pro Aufruf)", () => {
    const k = testKontext(inhalte.inventar.map((i) => i.g), { inhalte });
    generiere(k, 0); // Aufwärmen (JIT, Caches)
    const durchlaeufe = 20;
    const start = performance.now();
    for (let seed = 1; seed <= durchlaeufe; seed++) generiere(k, seed);
    const proAufruf = (performance.now() - start) / durchlaeufe;
    expect(proAufruf).toBeLessThan(50);
  });
});

describe("pruefeBuchstabenStand", () => {
  it("meldet fehlenden Vokal oder Konsonanten", () => {
    expect(pruefeBuchstabenStand(testKontext([]))).toEqual({ ok: false, fehlt: "vokal" });
    expect(pruefeBuchstabenStand(testKontext(["m"]))).toEqual({ ok: false, fehlt: "vokal" });
    expect(pruefeBuchstabenStand(testKontext(["a"]))).toEqual({ ok: false, fehlt: "konsonant" });
    expect(pruefeBuchstabenStand(testKontext(["m", "a"]))).toEqual({ ok: true });
  });
});

describe("zaehleWoerterMitGraphem", () => {
  it("zählt lesbare Wörter, die das Graphem enthalten", () => {
    const k = testKontext(["m", "i", "a"]);
    expect(zaehleWoerterMitGraphem(k, "i")).toBe(4); // Mami, Mia, Mimi, im
    expect(zaehleWoerterMitGraphem(k, "a")).toBe(4); // am, Mama, Mami, Mia
    expect(zaehleWoerterMitGraphem(k, "o")).toBe(0);
  });
});
