import { motion } from "motion/react";
import { useState } from "react";
import type { BonusOption, BonusRunde } from "../generator/typen";

const WEITER_NACH_MS = 700;

/** `onGeloest` meldet jede gelöste Runde sofort; `onFertig` nur das Ende. */
export function BonusSpiel({ runden, onFertig, onGeloest }: {
  runden: BonusRunde[]; onFertig(geloest: number): void; onGeloest?(): void;
}) {
  const [index, setIndex] = useState(0);
  const [wackelt, setWackelt] = useState<string | null>(null);
  const [geloest, setGeloest] = useState(false);
  const runde = runden[index];

  function waehle(o: BonusOption) {
    if (geloest) return;
    if (!o.richtig) { setWackelt(o.emoji); return; }
    setGeloest(true);
    onGeloest?.();
    setTimeout(() => {
      if (index + 1 >= runden.length) { onFertig(runden.length); return; }
      setIndex(index + 1);
      setGeloest(false);
      setWackelt(null);
    }, WEITER_NACH_MS);
  }

  return (
    <section className="einzel">
      <p className="leise">Lies das Wort und tippe auf das passende Bild!</p>
      <p className="lesetext">{runde.wort}</p>
      <div className="optionen">
        {runde.optionen.map((o) => (
          <motion.button
            key={`${index}-${o.emoji}`}
            aria-label={`Bild ${o.emoji}`}
            className={geloest && o.richtig ? "option richtig" : "option"}
            animate={wackelt === o.emoji ? { x: [0, -12, 12, -8, 8, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            onAnimationComplete={() => { if (wackelt === o.emoji) setWackelt(null); }}
            onClick={() => waehle(o)}
          >
            {o.emoji}
          </motion.button>
        ))}
      </div>
      {geloest && <p className="lob">⭐ Super!</p>}
      <p className="leise">Runde {index + 1} von {runden.length}</p>
    </section>
  );
}
