import { useLayoutEffect, useRef, useState } from "react";
import type { LeseElement, Leseblatt } from "../generator/typen";
import { teileZeilen } from "./zeilen";

function Element({ el }: { el: LeseElement }) {
  if (!el.teile) return <span className="element">{el.text}</span>;
  return (
    <span className="element satz">
      {el.teile.map((t, i) =>
        t.art === "text"
          ? <span key={i}>{t.text}</span>
          : <span key={i} role="img" aria-label={t.wort} className="bild">{t.emoji}</span>,
      )}
    </span>
  );
}

/**
 * Misst am ungeteilten Blatt, welche Elemente nebeneinander in eine Zeile passen.
 * Platz für den Haken einer gelesenen Zeile wird freigehalten, damit das Antippen nichts umbrechen lässt.
 */
function messePlatz(abschnitt: HTMLElement, blatt: Leseblatt): (elemente: LeseElement[]) => boolean {
  const zeilen = [...abschnitt.querySelectorAll<HTMLElement>(":scope > .zeile")];
  const erste = zeilen[0];
  if (!erste) return () => true;
  const stil = getComputedStyle(erste);
  const px = (wert: string) => parseFloat(wert) || 0;
  const luecke = px(stil.columnGap);
  const markierung = erste.querySelector(".stern-markierung")?.getBoundingClientRect().width ?? 0;
  const haken = luecke + 0.6 * px(stil.fontSize);
  const platz = erste.clientWidth - px(stil.paddingLeft) - px(stil.paddingRight) - markierung - luecke - haken;
  if (platz <= 0) return () => true; // kein Layout (z. B. in Tests)

  const breiten = new Map<LeseElement, number>();
  blatt.zeilen.forEach((zeile, i) => {
    const spans = zeilen[i]?.querySelectorAll(":scope > .element") ?? [];
    zeile.elemente.forEach((el, j) => breiten.set(el, spans[j]?.getBoundingClientRect().width ?? 0));
  });
  return (elemente) =>
    elemente.reduce((summe, el) => summe + (breiten.get(el) ?? 0), 0) + luecke * (elemente.length - 1) <= platz;
}

export function LeseblattAnsicht({ blatt: original, nummer, onFertig }: { blatt: Leseblatt; nummer: number; onFertig(): void }) {
  // Einmal pro Blatt an die Breite anpassen: Beim Drehen des Geräts sollen gelesene Zeilen nicht verrutschen.
  const [angepasst, setAngepasst] = useState<Leseblatt | null>(null);
  const abschnitt = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (!angepasst && abschnitt.current) setAngepasst(teileZeilen(original, messePlatz(abschnitt.current, original)));
  }, [angepasst, original]);
  const blatt = angepasst ?? original;
  // Gelesene Zeilen antippen: hilft beim Mitlesen und ist zugleich die Eingabe, die die Lesezeit am Laufen hält.
  const [gelesen, setGelesen] = useState<ReadonlySet<number>>(new Set());
  const umschalten = (i: number) => setGelesen((g) => {
    const neu = new Set(g);
    if (!neu.delete(i)) neu.add(i);
    return neu;
  });
  return (
    <section className="blatt" ref={abschnitt}>
      <h2>Leseblatt {nummer}</h2>
      <p className="leise">Tippe auf eine Zeile, wenn du sie gelesen hast.</p>
      {blatt.zeilen.map((zeile, i) => (
        <div key={i} className={`zeile ${zeile.art}${gelesen.has(i) ? " gelesen" : ""}`} role="button" tabIndex={0}
          aria-pressed={gelesen.has(i)} onClick={() => umschalten(i)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            umschalten(i);
          }}>
          <span className="stern-markierung" aria-hidden="true">{zeile.stern ? "⭐" : ""}</span>
          {zeile.elemente.map((el, j) => <Element key={j} el={el} />)}
          {gelesen.has(i) && <span className="zeile-haken" aria-hidden="true">✓</span>}
        </div>
      ))}
      <button className="haupt gross" onClick={onFertig}>✓ Blatt fertig</button>
    </section>
  );
}
