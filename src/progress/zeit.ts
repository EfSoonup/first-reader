export const LEERLAUF_EINZEL_MS = 60_000;
export const LEERLAUF_BLATT_MS = 300_000;

export interface Zeitmesser {
  aktivMs: number;
  letzterZeitpunkt: number;
  letzteEingabe: number;
  manuellPausiert: boolean;
  leerlaufMs: number;
  /** Endgültig angehalten (z. B. auf dem Abschluss-Bildschirm); keine Eingabe startet ihn wieder. */
  gestoppt: boolean;
}

export function starteZeitmesser(jetzt: number, leerlaufMs: number): Zeitmesser {
  return { aktivMs: 0, letzterZeitpunkt: jetzt, letzteEingabe: jetzt, manuellPausiert: false, leerlaufMs, gestoppt: false };
}

export function tick(z: Zeitmesser, jetzt: number): Zeitmesser {
  if (z.manuellPausiert || z.gestoppt) return { ...z, letzterZeitpunkt: jetzt };
  const ende = Math.min(jetzt, z.letzteEingabe + z.leerlaufMs);
  const zuwachs = Math.max(0, ende - z.letzterZeitpunkt);
  return { ...z, aktivMs: z.aktivMs + zuwachs, letzterZeitpunkt: jetzt };
}

export function eingabe(z: Zeitmesser, jetzt: number): Zeitmesser {
  if (z.gestoppt) return tick(z, jetzt);
  return { ...tick(z, jetzt), letzteEingabe: jetzt, manuellPausiert: false };
}

export function pausiere(z: Zeitmesser, jetzt: number): Zeitmesser {
  return { ...tick(z, jetzt), manuellPausiert: true };
}

export function stoppe(z: Zeitmesser, jetzt: number): Zeitmesser {
  return { ...tick(z, jetzt), gestoppt: true };
}

export function setzeLeerlauf(z: Zeitmesser, jetzt: number, leerlaufMs: number): Zeitmesser {
  return { ...eingabe(z, jetzt), leerlaufMs };
}

export function istPausiert(z: Zeitmesser, jetzt: number): boolean {
  return z.manuellPausiert || z.gestoppt || jetzt - z.letzteEingabe > z.leerlaufMs;
}
