import { useState } from "react";
import type { AppDaten } from "../../progress/typen";
import type { Aktualisiere } from "../useAppDaten";
import { Buchstaben } from "./Buchstaben";
import { Einstellungen } from "./Einstellungen";

const TABS = ["Buchstaben", "Einstellungen"] as const;
type Tab = (typeof TABS)[number];

export function Elternbereich(p: { daten: AppDaten; aktualisiere: Aktualisiere; fehler: string | null; onZurueck(): void }) {
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
      {p.fehler && <p role="alert" className="hinweis fehler">{p.fehler}</p>}
      {tab === "Buchstaben" && <Buchstaben daten={p.daten} aktualisiere={p.aktualisiere} />}
      {tab === "Einstellungen" && <Einstellungen daten={p.daten} aktualisiere={p.aktualisiere} />}
    </main>
  );
}
