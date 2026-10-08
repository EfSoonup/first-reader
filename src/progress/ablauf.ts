export type Phase = "aufwaermen" | "blatt" | "bonus" | "abschluss";

export function erstePhase(aufwaermAnzahl: number): Phase {
  return aufwaermAnzahl > 0 ? "aufwaermen" : "blatt";
}

export function nachBlatt(p: { zielBeiStartErreicht: boolean; zielJetztErreicht: boolean; bonusVerfuegbar: boolean }): Phase {
  if (p.zielBeiStartErreicht || p.zielJetztErreicht) return p.bonusVerfuegbar ? "bonus" : "abschluss";
  return "blatt";
}
