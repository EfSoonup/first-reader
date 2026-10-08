import { describe, expect, it } from "vitest";
import { inhalte } from "./index";

describe("inhalte", () => {
  it("lädt alle Inhaltsdateien", () => {
    expect(inhalte.inventar.length).toBeGreaterThan(40);
    expect(inhalte.woerter.map((w) => w.text)).toContain("Mama");
    expect(inhalte.bilder).toHaveLength(30);
    expect(inhalte.schablonen.map((s) => s.id)).toContain("name-im");
    expect(inhalte.sperrliste).toContain("kack");
  });

  it("Grapheme sind klein geschrieben und eindeutig", () => {
    const gs = inhalte.inventar.map((i) => i.g);
    expect(new Set(gs).size).toBe(gs.length);
    for (const g of gs) expect(g).toBe(g.toLowerCase());
  });
});
