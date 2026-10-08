import { wochenUebersicht } from "../../progress/auswertung";
import type { AppDaten } from "../../progress/typen";
import { alsDatum } from "./Protokoll";

const TAGE = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

export function Wochenuebersicht({ daten }: { daten: AppDaten }) {
  const woche = wochenUebersicht(daten.sitzungen, new Date(), daten.einstellungen.tageszielMinuten);
  return (
    <section className="druckbereich">
      <h2>Lesenachweis: Woche vom {alsDatum(woche[0].tag)} bis {alsDatum(woche[6].tag)}</h2>
      <table className="tabelle">
        <thead><tr><th>Tag</th><th>Datum</th><th>Minuten gelesen</th><th>Wörter gelesen</th><th>😊</th></tr></thead>
        <tbody>
          {woche.map((z, i) => (
            <tr key={z.tag}>
              <td>{TAGE[i]}</td>
              <td>{alsDatum(z.tag)}</td>
              <td>{Math.floor(z.aktiveSekunden / 60)}</td>
              <td>{z.richtig}</td>
              <td>{z.zielErreicht ? "😊" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="unterschrift">Unterschrift: ______________________________</p>
      <button className="nicht-drucken haupt" onClick={() => window.print()}>🖨️ Drucken</button>
    </section>
  );
}
