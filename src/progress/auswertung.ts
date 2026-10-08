import type { Sitzung } from "./typen";

const zweistellig = (n: number) => String(n).padStart(2, "0");

export function tagSchluessel(d: Date): string {
  return `${d.getFullYear()}-${zweistellig(d.getMonth() + 1)}-${zweistellig(d.getDate())}`;
}

function plusTage(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export interface Tageswerte { tag: string; aktiveSekunden: number; richtig: number; fehlversuche: number }
export interface ProtokollZeile extends Tageswerte { zielErreicht: boolean }

export function tageswerte(sitzungen: readonly Sitzung[], tag: string): Tageswerte {
  const werte: Tageswerte = { tag, aktiveSekunden: 0, richtig: 0, fehlversuche: 0 };
  for (const s of sitzungen) {
    if (tagSchluessel(new Date(s.start)) !== tag) continue;
    werte.aktiveSekunden += s.aktiveSekunden;
    werte.richtig += s.richtig;
    werte.fehlversuche += s.fehlversuche;
  }
  return werte;
}

export function zielErreicht(w: Tageswerte, minuten: number): boolean {
  return w.aktiveSekunden >= minuten * 60;
}

function zeile(sitzungen: readonly Sitzung[], tag: string, minuten: number): ProtokollZeile {
  const w = tageswerte(sitzungen, tag);
  return { ...w, zielErreicht: zielErreicht(w, minuten) };
}

export function protokoll(sitzungen: readonly Sitzung[], minuten: number): ProtokollZeile[] {
  const tage = [...new Set(sitzungen.map((s) => tagSchluessel(new Date(s.start))))].sort().reverse();
  return tage.map((tag) => zeile(sitzungen, tag, minuten));
}

export function wochentage(heute: Date): string[] {
  const montag = plusTage(heute, -((heute.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => tagSchluessel(plusTage(montag, i)));
}

export function wochenUebersicht(sitzungen: readonly Sitzung[], heute: Date, minuten: number): ProtokollZeile[] {
  return wochentage(heute).map((tag) => zeile(sitzungen, tag, minuten));
}

export function wochenSmileys(sitzungen: readonly Sitzung[], heute: Date, minuten: number): boolean[] {
  return wochenUebersicht(sitzungen, heute, minuten).map((z) => z.zielErreicht);
}

export function leseKette(sitzungen: readonly Sitzung[], heute: Date, minuten: number): number {
  const erreicht = (d: Date) => zielErreicht(tageswerte(sitzungen, tagSchluessel(d)), minuten);
  let tag = erreicht(heute) ? heute : plusTage(heute, -1);
  let kette = 0;
  while (erreicht(tag)) {
    kette++;
    tag = plusTage(tag, -1);
  }
  return kette;
}
