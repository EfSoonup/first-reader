import { useCallback, useEffect, useState } from "react";
import type { AppDaten } from "../progress/typen";
import { holeSpeicher, ladeDaten, speichereDaten } from "../storage/storage";

export type Aktualisiere = (f: (d: AppDaten) => AppDaten) => void;

export function useAppDaten() {
  const [speicher] = useState(holeSpeicher);
  const [start] = useState(() => ladeDaten(speicher, new Date()));
  const [daten, setDaten] = useState<AppDaten>(start.daten);
  const [fehler, setFehler] = useState<string | null>(start.fehler);
  const [schreibschutz, setSchreibschutz] = useState(start.schreibschutz === true);

  const aktualisiere: Aktualisiere = useCallback((f) => setDaten(f), []);

  /** Elternteil verwirft die unlesbaren Rohdaten bewusst; ab jetzt wird wieder gespeichert. */
  const freigeben = useCallback(() => {
    setSchreibschutz(false);
    setFehler(null);
  }, []);

  useEffect(() => {
    if (schreibschutz) return;
    if (speicher && !speichereDaten(speicher, daten)) {
      setFehler("Speichern fehlgeschlagen – bitte im Elternbereich eine Sicherung exportieren.");
    }
  }, [daten, speicher, schreibschutz]);

  return { daten, aktualisiere, fehler, schreibschutz, freigeben };
}
