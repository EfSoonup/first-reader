import { useState } from "react";
import type { AppDaten } from "../../progress/typen";
import { exportiere, importiere } from "../../storage/storage";
import type { Aktualisiere } from "../useAppDaten";

export function Sicherung({ daten, aktualisiere, bestaetige = (f) => window.confirm(f) }: {
  daten: AppDaten; aktualisiere: Aktualisiere; bestaetige?: (frage: string) => boolean;
}) {
  const [meldung, setMeldung] = useState<{ text: string; fehler: boolean } | null>(null);

  function exportieren() {
    const { json, daten: neu, dateiname } = exportiere(daten, new Date());
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = dateiname;
    a.click();
    URL.revokeObjectURL(url);
    aktualisiere((d) => ({ ...d, letzteSicherung: neu.letzteSicherung }));
    setMeldung({ text: `Sicherung „${dateiname}“ gespeichert.`, fehler: false });
  }

  async function importieren(datei: File | undefined) {
    if (!datei) return;
    const ergebnis = importiere(await datei.text());
    if (!ergebnis.ok) { setMeldung({ text: ergebnis.fehler, fehler: true }); return; }
    if (!bestaetige("Alle aktuellen Daten werden durch die Sicherung ersetzt. Fortfahren?")) {
      setMeldung({ text: "Import abgebrochen.", fehler: false });
      return;
    }
    aktualisiere(() => ergebnis.daten);
    setMeldung({ text: "Sicherung importiert.", fehler: false });
  }

  return (
    <section>
      <aside role="note" aria-label="Datenschutz" className="hinweis">
        <strong>Wo sind die Daten?</strong> Lesestart speichert alles nur in diesem Browser auf diesem Gerät.
        Es gibt kein Konto, kein Tracking und keine Cookies, und nichts wird ins Internet übertragen.
        Deshalb gilt: Werden die Browserdaten gelöscht oder ein anderes Gerät benutzt, ist der Fortschritt weg –
        bitte regelmäßig eine Sicherung exportieren und die Datei aufbewahren.
      </aside>
      <p>
        Letzte Sicherung:{" "}
        {daten.letzteSicherung ? new Date(daten.letzteSicherung).toLocaleDateString("de-DE") : "noch nie"}
      </p>
      <button className="haupt" onClick={exportieren}>💾 Sicherung exportieren</button>
      <p>
        <label>
          Sicherung importieren{" "}
          <input type="file" accept="application/json,.json" onChange={(e) => importieren(e.target.files?.[0])} />
        </label>
      </p>
      {meldung && <p role={meldung.fehler ? "alert" : "status"} className={meldung.fehler ? "hinweis fehler" : "hinweis"}>{meldung.text}</p>}
    </section>
  );
}
