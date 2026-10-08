import { describe, expect, it } from "vitest";
import { aktualisiereWiederholungen } from "./wiederholung";
import type { Wiederholung } from "./typen";

describe("Wiederholungsspeicher", () => {
  it("nimmt Fehler auf und entfernt nach zweimal richtig in Folge", () => {
    let liste = aktualisiereWiederholungen([], [{ text: "Mimi", typ: "wort", richtig: false }]);
    expect(liste).toEqual([{ text: "Mimi", typ: "wort", richtigInFolge: 0 }]);
    liste = aktualisiereWiederholungen(liste, [{ text: "Mimi", typ: "wort", richtig: true }]);
    expect(liste[0].richtigInFolge).toBe(1);
    liste = aktualisiereWiederholungen(liste, [{ text: "Mimi", typ: "wort", richtig: true }]);
    expect(liste).toEqual([]);
  });

  it("ein Fehler setzt die Folge zurück", () => {
    let liste: Wiederholung[] = [{ text: "ma", typ: "silbe", richtigInFolge: 1 }];
    liste = aktualisiereWiederholungen(liste, [{ text: "ma", typ: "silbe", richtig: false }]);
    expect(liste[0].richtigInFolge).toBe(0);
  });

  it("richtige Ergebnisse ohne Eintrag ändern nichts", () => {
    expect(aktualisiereWiederholungen([], [{ text: "am", typ: "silbe", richtig: true }])).toEqual([]);
  });
});
