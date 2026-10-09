import { useState } from "react";
import type { LeseElement, Leseblatt } from "../generator/typen";

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

export function LeseblattAnsicht({ blatt, nummer, onFertig }: { blatt: Leseblatt; nummer: number; onFertig(): void }) {
  // Gelesene Zeilen antippen: hilft beim Mitlesen und ist zugleich die Eingabe, die die Lesezeit am Laufen hält.
  const [gelesen, setGelesen] = useState<ReadonlySet<number>>(new Set());
  const umschalten = (i: number) => setGelesen((g) => {
    const neu = new Set(g);
    if (!neu.delete(i)) neu.add(i);
    return neu;
  });
  return (
    <section className="blatt">
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
