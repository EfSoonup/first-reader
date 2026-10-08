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
  return (
    <section className="blatt">
      <h2>Leseblatt {nummer}</h2>
      {blatt.zeilen.map((zeile, i) => (
        <div key={i} className={`zeile ${zeile.art}`}>
          <span className="stern-markierung" aria-hidden="true">{zeile.stern ? "⭐" : ""}</span>
          {zeile.elemente.map((el, j) => <Element key={j} el={el} />)}
        </div>
      ))}
      <button className="haupt gross" onClick={onFertig}>✓ Blatt fertig</button>
    </section>
  );
}
