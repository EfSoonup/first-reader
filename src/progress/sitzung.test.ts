import { describe, expect, it } from "vitest";
import { neueSitzung, upsertSitzung } from "./sitzung";
import { leereDaten } from "./typen";

describe("Sitzung speichern", () => {
  it("fügt neu ein und ersetzt bei gleicher id", () => {
    const jetzt = new Date(2026, 9, 8, 10);
    let daten = leereDaten(jetzt);
    const s = neueSitzung("a", jetzt);
    daten = upsertSitzung(daten, s);
    expect(daten.sitzungen).toHaveLength(1);
    daten = upsertSitzung(daten, { ...s, aktiveSekunden: 42 });
    expect(daten.sitzungen).toHaveLength(1);
    expect(daten.sitzungen[0].aktiveSekunden).toBe(42);
    daten = upsertSitzung(daten, neueSitzung("b", jetzt));
    expect(daten.sitzungen.map((x) => x.id)).toEqual(["a", "b"]);
  });

  it("neue Sitzung startet bei null", () => {
    expect(neueSitzung("x", new Date(0))).toMatchObject({
      id: "x", aktiveSekunden: 0, richtig: 0, fehlversuche: 0, gezeigteElemente: [],
    });
  });
});
