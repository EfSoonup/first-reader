// Fürs Kind ein Balken statt Minuten; die Minuten stehen nur im Tooltip und für Screenreader.
export function TagesFortschritt({ sekunden, zielMinuten, klein = false }: { sekunden: number; zielMinuten: number; klein?: boolean }) {
  const anteil = Math.min(1, sekunden / (zielMinuten * 60));
  const erreicht = anteil >= 1;
  const text = `${Math.floor(sekunden / 60)} von ${zielMinuten} Minuten`;
  return (
    <div className={`fortschritt${klein ? " klein" : ""}${erreicht ? " erreicht" : ""}`} role="progressbar"
      aria-label="Tagesziel" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(anteil * 100)}
      aria-valuetext={text} title={text}>
      <div style={{ width: `${anteil * 100}%` }} />
      {erreicht && <span className="fortschritt-stern" aria-hidden="true">⭐</span>}
    </div>
  );
}
