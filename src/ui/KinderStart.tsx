import { inhalte } from "../content";
import { pruefeBuchstabenStand, zaehleWoerterMitGraphem } from "../generator";
import { leseKette, tageswerte, tagSchluessel, wochenSmileys } from "../progress/auswertung";
import { erledigeFeier } from "../progress/freischaltung";
import { baueKontext } from "../progress/kontext";
import type { AppDaten } from "../progress/typen";
import { sicherungFaellig } from "../storage/storage";
import { Feier } from "./Feier";
import { TagesFortschritt } from "./TagesFortschritt";
import type { Aktualisiere } from "./useAppDaten";

const WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export function KinderStart(p: {
  daten: AppDaten; aktualisiere: Aktualisiere; onLos(): void; onAlbum(): void; onEltern(): void;
}) {
  const jetzt = new Date();
  const k = baueKontext(p.daten, inhalte, jetzt);
  const stand = pruefeBuchstabenStand(k);
  const ziel = p.daten.einstellungen.tageszielMinuten;
  const heute = tageswerte(p.daten.sitzungen, tagSchluessel(jetzt));
  const smileys = wochenSmileys(p.daten.sitzungen, jetzt, ziel);
  const kette = leseKette(p.daten.sitzungen, jetzt, ziel);
  const feierGraphem = p.daten.spielstand.offeneFeier[0];

  return (
    <main className="seite kinderstart">
      <div className="kopfzeile">
        <span className="sterne">⭐ {p.daten.spielstand.sterne}</span>
        <button className="leise" onClick={p.onEltern}>
          Eltern{sicherungFaellig(p.daten, jetzt) ? " 💾" : ""}
        </button>
      </div>
      <div className="maskottchen" aria-hidden="true">🦊</div>
      <h1>Hallo! Lust zu lesen?</h1>
      <TagesFortschritt sekunden={heute.aktiveSekunden} zielMinuten={ziel} />
      <p>Heute gelesen: {heute.richtig} Wörter</p>
      <div className="smileys" aria-label="Wochen-Smileys">
        {WOCHENTAGE.map((tag, i) => (
          <span key={tag} title={tag}>{smileys[i] ? "😊" : "⚪"}<small>{tag}</small></span>
        ))}
      </div>
      <p>{kette > 0 ? `🔗 ${kette} ${kette === 1 ? "Tag" : "Tage"} in Folge` : "🔗 Neue Kette!"}</p>
      {stand.ok
        ? <button className="haupt gross" onClick={p.onLos}>Los geht's!</button>
        : <p className="hinweis">Hier gibt's bald was zu lesen!</p>}
      <button onClick={p.onAlbum}>🎁 Sticker-Album</button>
      <p className="leise fusszeile">🔒 Alles bleibt auf diesem Gerät.</p>
      {feierGraphem && (
        <Feier
          graphem={feierGraphem}
          anzahl={zaehleWoerterMitGraphem(k, feierGraphem)}
          onFertig={() => p.aktualisiere((d) => erledigeFeier(d, feierGraphem))}
        />
      )}
    </main>
  );
}
