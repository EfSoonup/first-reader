import type { AppDaten, Sitzung } from "./typen";

export function neueSitzung(id: string, jetzt: Date): Sitzung {
  const iso = jetzt.toISOString();
  return { id, start: iso, ende: iso, aktiveSekunden: 0, richtig: 0, fehlversuche: 0, gezeigteElemente: [] };
}

export function upsertSitzung(daten: AppDaten, sitzung: Sitzung): AppDaten {
  const vorhanden = daten.sitzungen.some((s) => s.id === sitzung.id);
  return {
    ...daten,
    sitzungen: vorhanden
      ? daten.sitzungen.map((s) => (s.id === sitzung.id ? sitzung : s))
      : [...daten.sitzungen, sitzung],
  };
}
