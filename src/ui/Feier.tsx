import { motion } from "motion/react";
import { grossschreiben } from "../generator/grapheme";

export function Feier({ graphem, anzahl, onFertig }: { graphem: string; anzahl: number; onFertig(): void }) {
  const gross = grossschreiben(graphem);
  return (
    <div className="overlay" role="dialog" aria-label="Neuer Buchstabe">
      <motion.div
        className="karte feier"
        initial={{ scale: 0.3, rotate: -10, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
      >
        <p>🎉 Neu freigeschaltet:</p>
        <p className="feier-graphem">{gross === graphem ? graphem : `${gross} ${graphem}`}</p>
        {anzahl > 0 && (
          <p>Jetzt kannst du {anzahl} {anzahl === 1 ? "Wort" : "Wörter"} mit {gross} lesen!</p>
        )}
        <button className="haupt" onClick={onFertig}>Juhu!</button>
      </motion.div>
    </div>
  );
}
