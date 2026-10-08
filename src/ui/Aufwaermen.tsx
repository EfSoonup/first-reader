import { useEffect, useState, type PointerEvent } from "react";
import type { LeseElement } from "../generator/typen";
import type { LeseErgebnis } from "../progress/wiederholung";

export interface AufwaermErgebnis { ergebnisse: LeseErgebnis[]; sterne: number }

const keinFokus = (e: PointerEvent) => e.preventDefault();

export function Aufwaermen({ elemente, onFertig }: { elemente: LeseElement[]; onFertig(e: AufwaermErgebnis): void }) {
  const [schlange, setSchlange] = useState<number[]>(() => elemente.map((_, i) => i));
  const [falsch, setFalsch] = useState<ReadonlySet<number>>(new Set());
  const [zurueckgestellt, setZurueckgestellt] = useState<ReadonlySet<number>>(new Set());
  const [sterne, setSterne] = useState(0);
  const aktuell = schlange[0];

  function weiter(rest: number[], neuFalsch: ReadonlySet<number>, neuSterne: number) {
    if (rest.length === 0) {
      onFertig({
        ergebnisse: elemente.map((el, i) => ({ text: el.text, typ: el.typ, richtig: !neuFalsch.has(i) })),
        sterne: neuSterne,
      });
      return;
    }
    setSchlange(rest);
  }

  function richtig() {
    if (aktuell === undefined) return;
    setSterne(sterne + 1);
    weiter(schlange.slice(1), falsch, sterne + 1);
  }

  function nochmal() {
    if (aktuell === undefined) return;
    const neuFalsch = new Set(falsch).add(aktuell);
    const rest = schlange.slice(1);
    if (!zurueckgestellt.has(aktuell)) {
      rest.push(aktuell);
      setZurueckgestellt(new Set(zurueckgestellt).add(aktuell));
    }
    setFalsch(neuFalsch);
    weiter(rest, neuFalsch, sterne);
  }

  useEffect(() => {
    const beiTaste = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); richtig(); }
      if (e.key === "Backspace") { e.preventDefault(); nochmal(); }
    };
    window.addEventListener("keydown", beiTaste);
    return () => window.removeEventListener("keydown", beiTaste);
  });

  if (aktuell === undefined) return null;
  return (
    <section className="einzel">
      <p className="lesetext">{elemente[aktuell].text}</p>
      <div className="bewertung">
        <button onPointerDown={keinFokus} onClick={nochmal}>↻ Nochmal</button>
        <button className="haupt" onPointerDown={keinFokus} onClick={richtig}>✓ Richtig</button>
      </div>
      <p className="leise">Noch {schlange.length}</p>
    </section>
  );
}
