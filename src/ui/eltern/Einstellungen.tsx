import type { AppDaten } from "../../progress/typen";
import type { Aktualisiere } from "../useAppDaten";

export function Einstellungen({ daten, aktualisiere }: { daten: AppDaten; aktualisiere: Aktualisiere }) {
  return (
    <section>
      <label>
        Tagesziel (Minuten aktive Lesezeit){" "}
        <input type="number" min={1} max={60} defaultValue={daten.einstellungen.tageszielMinuten}
          onChange={(e) => {
            const wert = Number(e.target.value);
            if (!Number.isInteger(wert) || wert < 1 || wert > 60) return;
            aktualisiere((d) => ({ ...d, einstellungen: { ...d.einstellungen, tageszielMinuten: wert } }));
          }} />
      </label>
    </section>
  );
}
