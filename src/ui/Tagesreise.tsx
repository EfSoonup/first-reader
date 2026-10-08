import { useEffect, useRef, useState } from "react";
import { inhalte } from "../content";
import { erzeugeLeseblatt, erzeugeRng, generiere } from "../generator";
import { erstePhase, nachBlatt, type Phase } from "../progress/ablauf";
import { tageswerte, tagSchluessel, zielErreicht } from "../progress/auswertung";
import { addiereSterne, vergebeTagesSticker } from "../progress/belohnungen";
import { baueKontext } from "../progress/kontext";
import { neueSitzung, upsertSitzung } from "../progress/sitzung";
import type { AppDaten, Sitzung } from "../progress/typen";
import { aktualisiereWiederholungen } from "../progress/wiederholung";
import {
  eingabe, istPausiert, LEERLAUF_BLATT_MS, LEERLAUF_EINZEL_MS, pausiere, setzeLeerlauf, starteZeitmesser, tick,
} from "../progress/zeit";
import { Abschluss } from "./Abschluss";
import { Aufwaermen, type AufwaermErgebnis } from "./Aufwaermen";
import { BonusSpiel } from "./BonusSpiel";
import { LeseblattAnsicht } from "./LeseblattAnsicht";
import { SternZaehler } from "./SternZaehler";
import type { Aktualisiere } from "./useAppDaten";

export const STERNE_PRO_BLATT = 5;

const leerlaufFuer = (phase: Phase) => (phase === "blatt" ? LEERLAUF_BLATT_MS : LEERLAUF_EINZEL_MS);

export function Tagesreise({ daten, aktualisiere, onEnde }: { daten: AppDaten; aktualisiere: Aktualisiere; onEnde(): void }) {
  const [start] = useState(() => {
    const jetzt = new Date();
    const kontext = baueKontext(daten, inhalte, jetzt);
    const tag = tagSchluessel(jetzt);
    return {
      jetzt,
      kontext,
      tag,
      material: generiere(kontext, jetzt.getTime()),
      zielBeiStart: zielErreicht(tageswerte(daten.sitzungen, tag), daten.einstellungen.tageszielMinuten),
    };
  });
  const [phase, setPhase] = useState<Phase>(() => erstePhase(start.material.aufwaermen.length));
  const [blatt, setBlatt] = useState(start.material.leseblatt);
  const [blattNummer, setBlattNummer] = useState(1);
  const [sitzung, setSitzung] = useState<Sitzung>(() => neueSitzung(crypto.randomUUID(), start.jetzt));
  const [abschluss, setAbschluss] = useState({ sticker: null as string | null, zielErreicht: false });
  const [pausiert, setPausiert] = useState(false);
  const zeit = useRef(starteZeitmesser(Date.now(), leerlaufFuer(phase)));
  const ziel = daten.einstellungen.tageszielMinuten;

  useEffect(() => { aktualisiere((d) => upsertSitzung(d, sitzung)); }, [sitzung, aktualisiere]);

  useEffect(() => {
    const takt = setInterval(() => {
      const jetzt = Date.now();
      zeit.current = tick(zeit.current, jetzt);
      setPausiert(istPausiert(zeit.current, jetzt));
      const sekunden = Math.floor(zeit.current.aktivMs / 1000);
      setSitzung((s) => (s.aktiveSekunden === sekunden ? s : { ...s, aktiveSekunden: sekunden, ende: new Date(jetzt).toISOString() }));
    }, 1000);
    const beiEingabe = () => {
      zeit.current = eingabe(zeit.current, Date.now());
      setPausiert(false);
    };
    window.addEventListener("pointerdown", beiEingabe);
    window.addEventListener("keydown", beiEingabe);
    return () => {
      clearInterval(takt);
      window.removeEventListener("pointerdown", beiEingabe);
      window.removeEventListener("keydown", beiEingabe);
    };
  }, []);

  useEffect(() => {
    zeit.current = setzeLeerlauf(zeit.current, Date.now(), leerlaufFuer(phase));
  }, [phase]);

  function aktuellerStand(s: Sitzung): Sitzung {
    zeit.current = tick(zeit.current, Date.now());
    return { ...s, aktiveSekunden: Math.floor(zeit.current.aktivMs / 1000), ende: new Date().toISOString() };
  }

  function zielMit(s: Sitzung): boolean {
    const andere = daten.sitzungen.filter((x) => x.id !== s.id);
    return zielErreicht(tageswerte([...andere, s], start.tag), ziel);
  }

  function beende(s: Sitzung) {
    const erreicht = zielMit(s);
    let sticker: string | null = null;
    if (erreicht) {
      sticker = vergebeTagesSticker(daten.spielstand, start.tag).sticker;
      aktualisiere((d) => ({ ...d, spielstand: vergebeTagesSticker(d.spielstand, start.tag).spielstand }));
    }
    setAbschluss({ sticker, zielErreicht: erreicht });
    setPhase("abschluss");
  }

  function aufwaermenFertig({ ergebnisse, sterne }: AufwaermErgebnis) {
    const richtig = ergebnisse.filter((e) => e.richtig).length;
    const s = aktuellerStand(sitzung);
    setSitzung({
      ...s,
      richtig: s.richtig + richtig,
      fehlversuche: s.fehlversuche + ergebnisse.length - richtig,
      gezeigteElemente: [...s.gezeigteElemente, ...ergebnisse.map((e) => e.text)],
    });
    aktualisiere((d) => ({
      ...d,
      wiederholungen: aktualisiereWiederholungen(d.wiederholungen, ergebnisse),
      spielstand: addiereSterne(d.spielstand, sterne),
    }));
    setPhase("blatt");
  }

  function blattFertig() {
    const elemente = blatt.zeilen.flatMap((z) => z.elemente);
    const s = aktuellerStand(sitzung);
    const neu = {
      ...s,
      richtig: s.richtig + elemente.length,
      gezeigteElemente: [...s.gezeigteElemente, ...elemente.map((e) => e.text)],
    };
    setSitzung(neu);
    aktualisiere((d) => ({ ...d, spielstand: addiereSterne(d.spielstand, STERNE_PRO_BLATT) }));
    const naechste = nachBlatt({
      zielBeiStartErreicht: start.zielBeiStart,
      zielJetztErreicht: zielMit(neu),
      bonusVerfuegbar: start.material.bonus !== null,
    });
    if (naechste === "blatt") {
      setBlatt(erzeugeLeseblatt(start.kontext, erzeugeRng(Date.now())));
      setBlattNummer((n) => n + 1);
    } else if (naechste === "bonus") {
      setPhase("bonus");
    } else {
      beende(neu);
    }
  }

  function bonusFertig(geloest: number) {
    const s = aktuellerStand(sitzung);
    const neu = { ...s, richtig: s.richtig + geloest };
    setSitzung(neu);
    aktualisiere((d) => ({ ...d, spielstand: addiereSterne(d.spielstand, geloest) }));
    beende(neu);
  }

  function sofortBeenden() {
    const s = aktuellerStand(sitzung);
    aktualisiere((d) => upsertSitzung(d, s));
    onEnde();
  }

  function pauseKnopf() {
    if (pausiert) return; // der Zeiger-Druck hat die Pause bereits aufgehoben
    zeit.current = pausiere(zeit.current, Date.now());
    setPausiert(true);
  }

  const heute = tageswerte([...daten.sitzungen.filter((x) => x.id !== sitzung.id), sitzung], start.tag);

  return (
    <main className="seite reise">
      <div className="kopfzeile">
        <SternZaehler sterne={daten.spielstand.sterne} />
        <span className="leise">{Math.floor(heute.aktiveSekunden / 60)} / {ziel} min</span>
        <button onClick={pauseKnopf}>{pausiert ? "▶ Weiter" : "⏸ Pause"}</button>
        <button className="leise" onClick={sofortBeenden}>Sitzung beenden</button>
      </div>
      {pausiert && phase !== "abschluss" && <p className="hinweis">Pause – die Zeit läuft gerade nicht.</p>}
      {phase === "aufwaermen" && <Aufwaermen elemente={start.material.aufwaermen} onFertig={aufwaermenFertig} />}
      {phase === "blatt" && <LeseblattAnsicht key={blattNummer} blatt={blatt} nummer={blattNummer} onFertig={blattFertig} />}
      {phase === "bonus" && start.material.bonus && <BonusSpiel runden={start.material.bonus} onFertig={bonusFertig} />}
      {phase === "abschluss" && (
        <Abschluss sticker={abschluss.sticker} woerterHeute={heute.richtig} zielErreicht={abschluss.zielErreicht}
          bonusGesperrt={start.material.bonus === null} onFertig={onEnde} />
      )}
    </main>
  );
}
