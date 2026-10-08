import { protokoll } from "../../progress/auswertung";
import type { AppDaten } from "../../progress/typen";

export const alsDatum = (tag: string) => {
  const [j, m, t] = tag.split("-");
  return `${t}.${m}.${j}`;
};

export function Protokoll({ daten }: { daten: AppDaten }) {
  const zeilen = protokoll(daten.sitzungen, daten.einstellungen.tageszielMinuten);
  if (zeilen.length === 0) return <p>Noch keine Lesezeiten erfasst.</p>;
  return (
    <table className="tabelle">
      <thead>
        <tr><th>Datum</th><th>Minuten</th><th>Gelesen</th><th>Fehlversuche</th><th>Ziel</th></tr>
      </thead>
      <tbody>
        {zeilen.map((z) => (
          <tr key={z.tag} aria-label={alsDatum(z.tag)}>
            <td>{alsDatum(z.tag)}</td>
            <td>{Math.floor(z.aktiveSekunden / 60)}</td>
            <td>{z.richtig}</td>
            <td>{z.fehlversuche}</td>
            <td>{z.zielErreicht ? "✅" : "–"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
