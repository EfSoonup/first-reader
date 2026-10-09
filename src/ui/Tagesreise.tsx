import { useEffect, useRef, useState } from "react";
import { inhalte } from "../content";
import { erzeugeLeseblatt, erzeugeRng, generiere } from "../generator";
import { erstePhase, nachBlatt, type Phase } from "../progress/ablauf";
import { tageswerte, tagSchluessel, zielErreicht } from "../progress/auswertung";
import { addiereSterne, vergebeTagesSticker } from "../progress/belohnungen";
import { baueKontext } from "../progress/kontext";
import { neueSitzung, upsertSitzung } from "../progress/sitzung";
import type { AppDaten, Sitzung } from "../progress/typen";
import { aktualisiereWiederholungen, type LeseErgebnis } from "../progress/wiederholung";
import {
  eingabe, istPausiert, LEERLAUF_BLATT_MS, LEERLAUF_EINZEL_MS, pausiere, setzeLeerlauf, starteZeitmesser, stoppe, tick,
} from "../progress/zeit";
import { Abschluss } from "./Abschluss";
import { Aufwaermen } from "./Aufwaermen";
import { BonusSpiel } from "./BonusSpiel";
import { LeseblattAnsicht } from "./LeseblattAnsicht";
import { SternZaehler } from "./SternZaehler";
import { TagesFortschritt } from "./TagesFortschritt";
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
    const beiEingabe = (e: Event) => {
      // Der Pause-Knopf schaltet selbst um; sonst höbe sein Zeiger-Druck die Pause vor dem Klick auf.
      if (e.target instanceof Element && e.target.closest("[data-pause-knopf]")) return;
      zeit.current = eingabe(zeit.current, Date.now());
      setPausiert(false);
    };
    // Gesperrtes Tablet oder anderer Tab: sofort anhalten statt bis zum Leerlauf-Limit weiterzuzählen.
    const beiSichtbarkeit = () => {
      if (document.visibilityState !== "hidden") return;
      zeit.current = pausiere(zeit.current, Date.now());
      setPausiert(true);
    };
    window.addEventListener("pointerdown", beiEingabe);
    window.addEventListener("keydown", beiEingabe);
    document.addEventListener("visibilitychange", beiSichtbarkeit);
    return () => {
      clearInterval(takt);
      window.removeEventListener("pointerdown", beiEingabe);
      window.removeEventListener("keydown", beiEingabe);
      document.removeEventListener("visibilitychange", beiSichtbarkeit);
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
    // Der Abschluss-Bildschirm ist keine Lesezeit.
    zeit.current = stoppe(zeit.current, Date.now());
    const erreicht = zielMit(s);
    let sticker: string | null = null;
    if (erreicht) {
      sticker = vergebeTagesSticker(daten.spielstand, start.tag).sticker;
      aktualisiere((d) => ({ ...d, spielstand: vergebeTagesSticker(d.spielstand, start.tag).spielstand }));
    }
    setAbschluss({ sticker, zielErreicht: erreicht });
    setPhase("abschluss");
  }

  function zeitStand(): Pick<Sitzung, "aktiveSekunden" | "ende"> {
    zeit.current = tick(zeit.current, Date.now());
    return { aktiveSekunden: Math.floor(zeit.current.aktivMs / 1000), ende: new Date().toISOString() };
  }

  function aufwaermErgebnis(e: LeseErgebnis) {
    const stand = zeitStand();
    setSitzung((s) => ({
      ...s,
      ...stand,
      richtig: s.richtig + (e.richtig ? 1 : 0),
      fehlversuche: s.fehlversuche + (e.richtig ? 0 : 1),
      gezeigteElemente: [...s.gezeigteElemente, e.text],
    }));
    aktualisiere((d) => ({ ...d, wiederholungen: aktualisiereWiederholungen(d.wiederholungen, [e]) }));
  }

  function stern() {
    aktualisiere((d) => ({ ...d, spielstand: addiereSterne(d.spielstand, 1) }));
  }

  function bonusRundeGeloest() {
    const stand = zeitStand();
    setSitzung((s) => ({ ...s, ...stand, richtig: s.richtig + 1 }));
    stern();
  }

  function blattFertig() {
    const elemente = blatt.zeilen.flatMap((z) => z.elemente);
    const s = aktuellerStand(sitzung);
    const neu = {
      ...s,
      richtig: s.richtig + elemente.filter((e) => e.typ !== "buchstabe").length,
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

  function bonusFertig() {
    beende(aktuellerStand(sitzung));
  }

  function sofortBeenden() {
    const s = aktuellerStand(sitzung);
    aktualisiere((d) => upsertSitzung(d, s));
    onEnde();
  }

  function pauseKnopf() {
    const jetzt = Date.now();
    const warPausiert = istPausiert(zeit.current, jetzt);
    zeit.current = warPausiert ? eingabe(zeit.current, jetzt) : pausiere(zeit.current, jetzt);
    setPausiert(!warPausiert);
  }

  const heute = tageswerte([...daten.sitzungen.filter((x) => x.id !== sitzung.id), sitzung], start.tag);

  return (
    <main className="seite reise">
      <div className="kopfzeile">
        <SternZaehler sterne={daten.spielstand.sterne} />
        <TagesFortschritt sekunden={heute.aktiveSekunden} zielMinuten={ziel} klein />
        {phase !== "abschluss" && (
          <button data-pause-knopf onPointerDown={(e) => e.preventDefault()} onClick={pauseKnopf}>{pausiert ? "▶ Weiter" : "⏸ Pause"}</button>
        )}
        <button className="leise" onClick={sofortBeenden}>Sitzung beenden</button>
      </div>
      {pausiert && phase !== "abschluss" && <p className="hinweis">Pause – die Zeit läuft gerade nicht.</p>}
      {phase === "aufwaermen" && <Aufwaermen elemente={start.material.aufwaermen} onFertig={() => setPhase("blatt")}
        onErgebnis={aufwaermErgebnis} onStern={stern} />}
      {phase === "blatt" && <LeseblattAnsicht key={blattNummer} blatt={blatt} nummer={blattNummer} onFertig={blattFertig} />}
      {phase === "bonus" && start.material.bonus && <BonusSpiel runden={start.material.bonus} onFertig={bonusFertig}
        onGeloest={bonusRundeGeloest} />}
      {phase === "abschluss" && (
        <Abschluss sticker={abschluss.sticker} woerterHeute={heute.richtig} zielErreicht={abschluss.zielErreicht}
          bonusGesperrt={start.material.bonus === null} onFertig={onEnde} />
      )}
    </main>
  );
}
