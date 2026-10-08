import { motion } from "motion/react";

export function Abschluss(p: {
  sticker: string | null; woerterHeute: number; zielErreicht: boolean; bonusGesperrt: boolean; onFertig(): void;
}) {
  return (
    <section className="einzel">
      {p.sticker && (
        <motion.div className="sticker-gross" initial={{ rotateY: 180, scale: 0.4 }} animate={{ rotateY: 0, scale: 1 }}
          transition={{ duration: 0.8 }}>
          {p.sticker}
        </motion.div>
      )}
      <h2>{p.zielErreicht ? "Geschafft! 🎉" : "Toll gelesen!"}</h2>
      <p>Du hast heute {p.woerterHeute} Wörter gelesen!</p>
      {p.sticker && <p>Ein neuer Sticker für dein Album!</p>}
      {p.zielErreicht && p.bonusGesperrt && <p className="hinweis">🔒 Bonusspiel: Bald freigeschaltet!</p>}
      <button className="haupt gross" onClick={p.onFertig}>Fertig</button>
    </section>
  );
}
