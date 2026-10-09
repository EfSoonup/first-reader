import { motion } from "motion/react";

// Nur der Stern hüpft: Würde der ganze Zähler wachsen, ragte er auf dem Handy in den Zeitbalken daneben.
export function SternZaehler({ sterne }: { sterne: number }) {
  return (
    <span className="sterne" aria-label={`${sterne} Sterne`}>
      <motion.span key={sterne} className="stern-hupf" initial={{ scale: 1.6 }} animate={{ scale: 1 }}>⭐</motion.span>
      {" "}{sterne}
    </span>
  );
}
