import { inhalte } from "../../content";
import { pruefeBuchstabenStand } from "../../generator";
import { grossschreiben } from "../../generator/grapheme";
import { schalteUm } from "../../progress/freischaltung";
import { baueKontext } from "../../progress/kontext";
import type { AppDaten } from "../../progress/typen";
import type { Aktualisiere } from "../useAppDaten";

export function Buchstaben({ daten, aktualisiere }: { daten: AppDaten; aktualisiere: Aktualisiere }) {
  const datum = new Map(daten.freischaltungen.map((f) => [f.graphem, f.datum]));
  const stand = pruefeBuchstabenStand(baueKontext(daten, inhalte, new Date()));
  const gruppe = (typ: "vokal" | "konsonant") =>
    inhalte.inventar.filter((i) => i.typ === typ).map((info) => {
      const an = datum.has(info.g);
      const gross = grossschreiben(info.g);
      return (
        <button key={info.g} aria-pressed={an} className={an ? "graphem an" : "graphem"}
          onClick={() => aktualisiere((d) => schalteUm(d, info.g, new Date()))}>
          {gross === info.g ? info.g : `${gross} ${info.g}`}
          {an && <small>{new Date(datum.get(info.g)!).toLocaleDateString("de-DE")}</small>}
        </button>
      );
    });
  return (
    <section>
      {!stand.ok && (
        <p role="alert" className="hinweis">
          Es fehlt noch ein {stand.fehlt === "vokal" ? "Vokal (z. B. A)" : "Konsonant (z. B. M)"} – sonst kann nichts erzeugt werden.
        </p>
      )}
      <h3>Vokale</h3>
      <div className="graphem-raster">{gruppe("vokal")}</div>
      <h3>Konsonanten</h3>
      <div className="graphem-raster">{gruppe("konsonant")}</div>
      <p className="leise">Tipp: Neue Wörter für einen Buchstaben in Claude Code mit <code>/neue-woerter</code> ergänzen.</p>
    </section>
  );
}
