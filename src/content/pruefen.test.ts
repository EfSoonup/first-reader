import { describe, expect, it } from "vitest";
import { inhalte } from "./index";
import { pruefeInhalte } from "./pruefen";
import type { Inhalte } from "./typen";

const mit = (aenderung: Partial<Inhalte>): Inhalte => ({ ...inhalte, ...aenderung });

describe("pruefeInhalte", () => {
  it("die mitgelieferten Inhalte sind gültig", () => {
    expect(pruefeInhalte(inhalte)).toEqual([]);
  });

  it("findet doppelte Wörter", () => {
    const fehler = pruefeInhalte(mit({ woerter: [...inhalte.woerter, { text: "mama", typ: "wort" }] }));
    expect(fehler.join("\n")).toContain("Doppeltes Wort");
  });

  it("findet nicht zerlegbare Wörter", () => {
    const fehler = pruefeInhalte(mit({ woerter: [...inhalte.woerter, { text: "Pizza1", typ: "wort" }] }));
    expect(fehler.join("\n")).toContain("nicht zerlegbar");
  });

  it("findet Emoji ohne Kategorie", () => {
    const fehler = pruefeInhalte(mit({ woerter: [...inhalte.woerter, { text: "Oma", typ: "name", emoji: "👵" }] }));
    expect(fehler.join("\n")).toContain("Kategorie");
  });

  it("findet Sperrlisten-Treffer in der Wortliste", () => {
    const fehler = pruefeInhalte(mit({ woerter: [...inhalte.woerter, { text: "Kacke", typ: "wort" }] }));
    expect(fehler.join("\n")).toContain("Sperrliste");
  });

  it("findet unbekannte Bild-Etiketten", () => {
    const bilder = [...inhalte.bilder, { emoji: "🦄", wort: "Einhorn", kategorie: "Tiere", etiketten: ["Fantasie"] }];
    expect(pruefeInhalte(mit({ bilder })).join("\n")).toContain("Etikett");
  });

  it("findet Platzhalter ohne Bild", () => {
    const schablonen = [...inhalte.schablonen, { id: "x", teile: ["[Name]", "auf", "[Ort-auf]"] }];
    expect(pruefeInhalte(mit({ schablonen })).join("\n")).toContain("kein Bild");
  });

  it("findet doppelte Schablonen-IDs und Emojis", () => {
    const fehler = pruefeInhalte(mit({
      schablonen: [...inhalte.schablonen, inhalte.schablonen[0]],
      bilder: [...inhalte.bilder, inhalte.bilder[0]],
    })).join("\n");
    expect(fehler).toContain("Doppelte Schablone");
    expect(fehler).toContain("Doppeltes Emoji");
  });
});
