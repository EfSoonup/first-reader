import { describe, expect, it } from "vitest";
import { erstePhase, nachBlatt } from "./ablauf";

describe("Ablauf der Tagesreise", () => {
  it("überspringt leeres Aufwärmen", () => {
    expect(erstePhase(8)).toBe("aufwaermen");
    expect(erstePhase(0)).toBe("blatt");
  });

  it("weiteres Blatt, solange das Ziel offen ist", () => {
    expect(nachBlatt({ zielBeiStartErreicht: false, zielJetztErreicht: false, bonusVerfuegbar: true })).toBe("blatt");
  });

  it("Bonus bzw. Abschluss, wenn das Ziel erreicht ist", () => {
    expect(nachBlatt({ zielBeiStartErreicht: false, zielJetztErreicht: true, bonusVerfuegbar: true })).toBe("bonus");
    expect(nachBlatt({ zielBeiStartErreicht: false, zielJetztErreicht: true, bonusVerfuegbar: false })).toBe("abschluss");
  });

  it("zweite Sitzung am Tag: genau ein Blatt", () => {
    expect(nachBlatt({ zielBeiStartErreicht: true, zielJetztErreicht: true, bonusVerfuegbar: true })).toBe("bonus");
  });
});
