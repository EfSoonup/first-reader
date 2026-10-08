import { useState } from "react";
import type { AppDaten } from "../../progress/typen";
import { sicherungFaellig } from "../../storage/storage";
import type { Aktualisiere } from "../useAppDaten";
import { Buchstaben } from "./Buchstaben";
import { Einstellungen } from "./Einstellungen";
import { Protokoll } from "./Protokoll";
import { Sicherung } from "./Sicherung";
import { Wochenuebersicht } from "./Wochenuebersicht";

const TABS = ["Buchstaben", "Protokoll", "Woche", "Sicherung", "Einstellungen"] as const;
type Tab = (typeof TABS)[number];

export function Elternbereich(p: {
  daten: AppDaten; aktualisiere: Aktualisiere; fehler: string | null; onZurueck(): void;
  schreibschutz?: boolean; onFreigeben?(): void;
}) {
  const [tab, setTab] = useState<Tab>("Buchstaben");
  return (
    <main className="seite eltern">
      <div className="kopfzeile nicht-drucken">
        <button onClick={p.onZurueck}>← Zum Kind</button>
        <nav className="tabs">
          {TABS.map((t) => (
            <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>{t}</button>
          ))}
        </nav>
      </div>
      {p.fehler && (
        <p role="alert" className="hinweis fehler nicht-drucken">
          {p.fehler}
          {p.schreibschutz && p.onFreigeben && (
            <>{" "}<button onClick={p.onFreigeben}>Alte Daten verwerfen und neu beginnen</button></>
          )}
        </p>
      )}
      {sicherungFaellig(p.daten, new Date()) && tab !== "Sicherung" && (
        <p className="hinweis nicht-drucken">
          💾 Die letzte Sicherung ist über 14 Tage her.{" "}
          <button onClick={() => setTab("Sicherung")}>Jetzt sichern</button>
        </p>
      )}
      {tab === "Buchstaben" && <Buchstaben daten={p.daten} aktualisiere={p.aktualisiere} />}
      {tab === "Protokoll" && <Protokoll daten={p.daten} />}
      {tab === "Woche" && <Wochenuebersicht daten={p.daten} />}
      {tab === "Sicherung" && <Sicherung daten={p.daten} aktualisiere={p.aktualisiere} />}
      {tab === "Einstellungen" && <Einstellungen daten={p.daten} aktualisiere={p.aktualisiere} />}
    </main>
  );
}
