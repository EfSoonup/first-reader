import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { TagesFortschritt } from "./TagesFortschritt";

const minuten = (n: number) => `${n} ${n === 1 ? "Minute" : "Minuten"}`;

/** Bremse vor dem vorzeitigen Beenden: Zusammenfassung des Tages und die Frage, ob das Kind wirklich aufhören will. */
export function EndeDialog(p: {
  sekunden: number; zielMinuten: number; woerter: number; blattOffen: boolean; onWeiter(): void; onAufhoeren(): void;
}) {
  const weiterKnopf = useRef<HTMLButtonElement>(null);
  const rest = Math.max(0, Math.ceil((p.zielMinuten * 60 - p.sekunden) / 60));
  const erreicht = rest === 0;
  const gelesen = Math.floor(p.sekunden / 60);

  useEffect(() => { weiterKnopf.current?.focus(); }, []);
  useEffect(() => {
    const beiTaste = (e: KeyboardEvent) => { if (e.key === "Escape") p.onWeiter(); };
    window.addEventListener("keydown", beiTaste);
    return () => window.removeEventListener("keydown", beiTaste);
  }, [p.onWeiter]);

  return (
    <div className="overlay" data-ende-dialog>
      <motion.div className="karte ende-dialog" role="dialog" aria-modal="true" aria-labelledby="ende-titel"
        initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.4 }}>
        <div className="ende-smiley" aria-hidden="true">{erreicht ? "😊" : "🙂"}</div>
        <h2 id="ende-titel">{erreicht ? "Super gelesen!" : "Toll gelesen!"}</h2>
        <TagesFortschritt sekunden={p.sekunden} zielMinuten={p.zielMinuten} />
        <p>⏱️ {gelesen < 1 ? "Gerade erst angefangen" : `${minuten(gelesen)} gelesen`} · 📖 {p.woerter} Wörter</p>
        {erreicht
          ? <p>Du hast deinen Smiley für heute schon verdient! 😊</p>
          : <p className="ende-ziel">Noch {minuten(rest)} lesen, dann bekommst du heute einen Smiley 😊</p>}
        {p.blattOffen && <p className="hinweis">Lies das Blatt zu Ende, dann zählen die Wörter darauf auch!</p>}
        {!erreicht && <p><strong>Willst du wirklich aufhören?</strong></p>}
        <div className="ende-knoepfe">
          <button ref={weiterKnopf} className="haupt gross" onClick={p.onWeiter}>💪 Weiterlesen</button>
          <button className="leise" onClick={p.onAufhoeren}>Für heute aufhören</button>
        </div>
      </motion.div>
    </div>
  );
}
