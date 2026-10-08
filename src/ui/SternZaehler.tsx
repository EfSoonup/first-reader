import { motion } from "motion/react";

export function SternZaehler({ sterne }: { sterne: number }) {
  return (
    <motion.span key={sterne} className="sterne" initial={{ scale: 1.6 }} animate={{ scale: 1 }} aria-label={`${sterne} Sterne`}>
      ⭐ {sterne}
    </motion.span>
  );
}
