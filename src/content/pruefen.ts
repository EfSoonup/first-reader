import { bildEtikett, istPlatzhalter, NAME_PLATZHALTER } from "../generator/bildsaetze";
import { istGesperrt, zerlege } from "../generator/grapheme";
import type { Inhalte } from "./typen";

const istText = (x: unknown): x is string => typeof x === "string" && x.trim().length > 0;

export function pruefeInhalte(inhalte: Inhalte): string[] {
  const fehler: string[] = [];

  const gesehenG = new Set<string>();
  for (const info of inhalte.inventar) {
    if (!istText(info.g) || info.g !== info.g.toLowerCase()) fehler.push(`Graphem ungültig: "${info.g}"`);
    if (gesehenG.has(info.g)) fehler.push(`Doppeltes Graphem: "${info.g}"`);
    gesehenG.add(info.g);
    if (info.typ !== "vokal" && info.typ !== "konsonant") fehler.push(`Graphem "${info.g}": Typ ungültig`);
  }

  const gesehenW = new Set<string>();
  const wortEmojis = new Map<string, string>();
  for (const w of inhalte.woerter) {
    if (!istText(w.text)) { fehler.push(`Wort ohne Text: ${JSON.stringify(w)}`); continue; }
    if (w.typ !== "wort" && w.typ !== "name") fehler.push(`Wort "${w.text}": Typ muss "wort" oder "name" sein`);
    const schluessel = w.text.toLowerCase();
    if (gesehenW.has(schluessel)) fehler.push(`Doppeltes Wort: "${w.text}"`);
    gesehenW.add(schluessel);
    if (!zerlege(w.text, inhalte.inventar, w.zerlegung)) fehler.push(`Wort "${w.text}" ist nicht zerlegbar`);
    if (w.emoji !== undefined && !istText(w.kategorie)) fehler.push(`Wort "${w.text}": Emoji ohne Kategorie`);
    if (w.emoji !== undefined) {
      const vorher = wortEmojis.get(w.emoji);
      if (vorher) fehler.push(`Wort "${w.text}": Emoji ${w.emoji} doppelt (schon bei "${vorher}")`);
      else wortEmojis.set(w.emoji, w.text);
    }
    if (istGesperrt(w.text, inhalte.sperrliste)) fehler.push(`Wort "${w.text}" trifft die Sperrliste`);
  }

  const genutzteEtiketten = new Set(
    inhalte.schablonen.flatMap((s) => s.teile.map(bildEtikett).filter((e): e is string => e !== null)),
  );
  const gesehenE = new Set<string>();
  for (const b of inhalte.bilder) {
    if (gesehenE.has(b.emoji)) fehler.push(`Doppeltes Emoji: ${b.emoji}`);
    gesehenE.add(b.emoji);
    if (!istText(b.wort) || !istText(b.kategorie)) fehler.push(`Bild ${b.emoji}: Wort oder Kategorie fehlt`);
    if (!Array.isArray(b.etiketten) || b.etiketten.length === 0) fehler.push(`Bild ${b.emoji}: keine Etiketten`);
    for (const e of b.etiketten ?? []) {
      if (!genutzteEtiketten.has(e)) fehler.push(`Bild ${b.emoji}: Etikett "${e}" wird von keiner Schablone verwendet`);
    }
  }

  const gesehenS = new Set<string>();
  for (const s of inhalte.schablonen) {
    if (gesehenS.has(s.id)) fehler.push(`Doppelte Schablone: "${s.id}"`);
    gesehenS.add(s.id);
    if (!Array.isArray(s.teile) || s.teile.length === 0) { fehler.push(`Schablone "${s.id}" ist leer`); continue; }
    for (const teil of s.teile) {
      if (teil === NAME_PLATZHALTER) continue;
      const etikett = bildEtikett(teil);
      if (etikett !== null) {
        if (!inhalte.bilder.some((b) => b.etiketten.includes(etikett))) {
          fehler.push(`Schablone "${s.id}": für "${teil}" gibt es kein Bild`);
        }
      } else if (istPlatzhalter(teil) || !zerlege(teil, inhalte.inventar)) {
        fehler.push(`Schablone "${s.id}": "${teil}" ist nicht zerlegbar`);
      }
    }
  }

  for (const s of inhalte.sperrliste) {
    if (!istText(s) || s !== s.toLowerCase()) fehler.push(`Sperrliste: ungültiger Eintrag "${s}"`);
  }

  return fehler;
}
