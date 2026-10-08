import type { Inhalte } from "../content/typen";

export type ElementTyp = "buchstabe" | "silbe" | "pseudowort" | "wort" | "satz";
export type SatzTeil = { art: "text"; text: string } | { art: "bild"; emoji: string; wort: string };
export interface LeseElement { typ: ElementTyp; text: string; teile?: SatzTeil[] }
export interface Zeile { art: "buchstaben" | "silben" | "woerter" | "saetze"; stern: boolean; elemente: LeseElement[] }
export interface Leseblatt { zeilen: Zeile[] }
export interface BonusOption { emoji: string; richtig: boolean }
export interface BonusRunde { wort: string; optionen: BonusOption[] }
export interface Tagesmaterial { aufwaermen: LeseElement[]; leseblatt: Leseblatt; bonus: BonusRunde[] | null }
export interface GeneratorKontext {
  bekannt: ReadonlySet<string>;
  neu: ReadonlySet<string>;
  kuerzlich: ReadonlySet<string>;
  wiederholungen: readonly { text: string; typ: ElementTyp }[];
  inhalte: Inhalte;
}
