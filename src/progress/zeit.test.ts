import { describe, expect, it } from "vitest";
import {
  eingabe, istPausiert, LEERLAUF_BLATT_MS, LEERLAUF_EINZEL_MS, pausiere, setzeLeerlauf, starteZeitmesser, stoppe, tick,
} from "./zeit";

const s = (sekunden: number) => sekunden * 1000;

describe("Zeitmesser", () => {
  it("zählt Zeit zwischen Ticks", () => {
    const z = tick(starteZeitmesser(0, LEERLAUF_EINZEL_MS), s(30));
    expect(z.aktivMs).toBe(s(30));
  });

  it("pausiert nach 60 s ohne Eingabe (die 60 s zählen noch)", () => {
    let z = starteZeitmesser(0, LEERLAUF_EINZEL_MS);
    z = tick(z, s(200));
    expect(z.aktivMs).toBe(s(60));
    expect(istPausiert(z, s(200))).toBe(true);
  });

  it("läuft nach einer Eingabe weiter", () => {
    let z = starteZeitmesser(0, LEERLAUF_EINZEL_MS);
    z = tick(z, s(200));
    z = eingabe(z, s(200));
    expect(istPausiert(z, s(200))).toBe(false);
    z = tick(z, s(210));
    expect(z.aktivMs).toBe(s(70));
  });

  it("im Leseblatt gilt 5 Minuten Leerlauf", () => {
    let z = starteZeitmesser(0, LEERLAUF_EINZEL_MS);
    z = setzeLeerlauf(z, 0, LEERLAUF_BLATT_MS);
    z = tick(z, s(240));
    expect(z.aktivMs).toBe(s(240));
    z = tick(z, s(400));
    expect(z.aktivMs).toBe(s(300));
  });

  it("Pause-Knopf stoppt sofort, Eingabe hebt ihn auf", () => {
    let z = starteZeitmesser(0, LEERLAUF_EINZEL_MS);
    z = tick(z, s(10));
    z = pausiere(z, s(10));
    z = tick(z, s(40));
    expect(z.aktivMs).toBe(s(10));
    expect(istPausiert(z, s(40))).toBe(true);
    z = eingabe(z, s(40));
    z = tick(z, s(45));
    expect(z.aktivMs).toBe(s(15));
  });

  it("zählt nichts doppelt bei mehreren Ticks", () => {
    let z = starteZeitmesser(0, LEERLAUF_EINZEL_MS);
    for (let t = 1; t <= 30; t++) z = tick(z, s(t));
    expect(z.aktivMs).toBe(s(30));
  });

  it("nach dem Stopp zählt nichts mehr, auch nicht nach einer Eingabe", () => {
    let z = starteZeitmesser(0, LEERLAUF_EINZEL_MS);
    z = stoppe(z, s(20));
    expect(z.aktivMs).toBe(s(20));
    z = eingabe(z, s(30));
    z = tick(z, s(50));
    expect(z.aktivMs).toBe(s(20));
    expect(istPausiert(z, s(50))).toBe(true);
  });
});
