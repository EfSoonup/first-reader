/**
 * Feste, kleine Test-Inhalte (die ursprüngliche Erstausstattung für M, I, A).
 * Tests, die genaue Zahlen oder IDs prüfen, nutzen diese Fixture, damit sie
 * unabhängig von der mitgelieferten Wortliste in content/ bleiben.
 * Inventar und Sperrliste kommen aus content/, weil sie die Regeln selbst sind.
 */
import inventar from "../../content/grapheme.json";
import sperrliste from "../../content/sperrliste.json";
import type { BildEintrag, GraphemInfo, Inhalte, Schablone, WortEintrag } from "../content/typen";

const woerter: WortEintrag[] = [
  { text: "am", typ: "wort" },
  { text: "im", typ: "wort" },
  { text: "Mama", typ: "name", emoji: "👩", kategorie: "Familie" },
  { text: "Mami", typ: "name" },
  { text: "Mia", typ: "name" },
  { text: "Mimi", typ: "name" },
];

const bilder: BildEintrag[] = [
  { emoji: "🚂", wort: "Zug", kategorie: "Fahrzeuge", etiketten: ["Ort-im"] },
  { emoji: "🚗", wort: "Auto", kategorie: "Fahrzeuge", etiketten: ["Ort-im", "Ding"] },
  { emoji: "✈️", wort: "Flugzeug", kategorie: "Fahrzeuge", etiketten: ["Ort-im"] },
  { emoji: "🚌", wort: "Bus", kategorie: "Fahrzeuge", etiketten: ["Ort-im"] },
  { emoji: "🏠", wort: "Haus", kategorie: "Orte", etiketten: ["Ort-im", "Ding"] },
  { emoji: "🛁", wort: "Bad", kategorie: "Orte", etiketten: ["Ort-im"] },
  { emoji: "🌲", wort: "Wald", kategorie: "Natur", etiketten: ["Ort-im"] },
  { emoji: "🏰", wort: "Schloss", kategorie: "Orte", etiketten: ["Ort-im", "Ding"] },
  { emoji: "⛺", wort: "Zelt", kategorie: "Orte", etiketten: ["Ort-im"] },
  { emoji: "🛏️", wort: "Bett", kategorie: "Dinge", etiketten: ["Ort-im"] },
  { emoji: "🌧️", wort: "Regen", kategorie: "Wetter", etiketten: ["Ort-im"] },
  { emoji: "💧", wort: "Wasser", kategorie: "Natur", etiketten: ["Ort-im"] },
  { emoji: "🎪", wort: "Zirkus", kategorie: "Orte", etiketten: ["Ort-im"] },
  { emoji: "❄️", wort: "Schnee", kategorie: "Wetter", etiketten: ["Ort-im"] },
  { emoji: "🌊", wort: "Meer", kategorie: "Natur", etiketten: ["Ort-am"] },
  { emoji: "🏖️", wort: "Strand", kategorie: "Natur", etiketten: ["Ort-am"] },
  { emoji: "🏔️", wort: "Berg", kategorie: "Natur", etiketten: ["Ort-am"] },
  { emoji: "🌳", wort: "Baum", kategorie: "Natur", etiketten: ["Ort-am", "Ding"] },
  { emoji: "🥅", wort: "Tor", kategorie: "Dinge", etiketten: ["Ort-am"] },
  { emoji: "🏞️", wort: "See", kategorie: "Natur", etiketten: ["Ort-am"] },
  { emoji: "🔥", wort: "Feuer", kategorie: "Natur", etiketten: ["Ort-am"] },
  { emoji: "🪟", wort: "Fenster", kategorie: "Dinge", etiketten: ["Ort-am"] },
  { emoji: "🎡", wort: "Riesenrad", kategorie: "Orte", etiketten: ["Ort-am"] },
  { emoji: "🌞", wort: "Sonne", kategorie: "Wetter", etiketten: ["Ding"] },
  { emoji: "🌈", wort: "Regenbogen", kategorie: "Wetter", etiketten: ["Ding"] },
  { emoji: "🐱", wort: "Katze", kategorie: "Tiere", etiketten: ["Ding"] },
  { emoji: "🐶", wort: "Hund", kategorie: "Tiere", etiketten: ["Ding"] },
  { emoji: "🌸", wort: "Blume", kategorie: "Natur", etiketten: ["Ding"] },
  { emoji: "⭐", wort: "Stern", kategorie: "Dinge", etiketten: ["Ding"] },
  { emoji: "🍎", wort: "Apfel", kategorie: "Essen", etiketten: ["Ding"] },
];

const schablonen: Schablone[] = [
  { id: "name-im", teile: ["[Name]", "im", "[Ort-im]"] },
  { id: "name-am", teile: ["[Name]", "am", "[Ort-am]"] },
  { id: "name-malt", teile: ["[Name]", "malt", "[Ding]"] },
  { id: "oma-ist-im", teile: ["Oma", "ist", "im", "[Ort-im]"] },
];

export const testInhalte: Inhalte = {
  inventar: inventar as GraphemInfo[],
  woerter,
  bilder,
  schablonen,
  sperrliste: sperrliste as string[],
};
