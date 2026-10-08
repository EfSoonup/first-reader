import type { ElementTyp } from "../generator/typen";
import type { Wiederholung } from "./typen";

export interface LeseErgebnis { text: string; typ: ElementTyp; richtig: boolean }

const ENTFERNEN_NACH = 2;

export function aktualisiereWiederholungen(
  liste: readonly Wiederholung[],
  ergebnisse: readonly LeseErgebnis[],
): Wiederholung[] {
  const nachText = new Map(liste.map((w) => [w.text, { ...w }]));
  for (const e of ergebnisse) {
    const vorhanden = nachText.get(e.text);
    if (!e.richtig) {
      nachText.set(e.text, { text: e.text, typ: e.typ, richtigInFolge: 0 });
    } else if (vorhanden) {
      const folge = vorhanden.richtigInFolge + 1;
      if (folge >= ENTFERNEN_NACH) nachText.delete(e.text);
      else nachText.set(e.text, { ...vorhanden, richtigInFolge: folge });
    }
  }
  return [...nachText.values()];
}
