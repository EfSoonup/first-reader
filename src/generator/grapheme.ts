import type { GraphemInfo } from "../content/typen";

const sortiertCache = new WeakMap<readonly GraphemInfo[], GraphemInfo[]>();

function nachLaengeSortiert(inventar: readonly GraphemInfo[]): GraphemInfo[] {
  let sortiert = sortiertCache.get(inventar);
  if (!sortiert) {
    sortiert = [...inventar].sort((a, b) => b.g.length - a.g.length);
    sortiertCache.set(inventar, sortiert);
  }
  return sortiert;
}

/** Zerlegt einen Text (ein Wort) gierig in Grapheme; null, wenn nicht vollständig zerlegbar. */
export function zerlege(
  text: string,
  inventar: readonly GraphemInfo[],
  explizit?: readonly string[],
): string[] | null {
  const klein = text.toLowerCase();
  if (klein.length === 0) return null;
  if (explizit) {
    const ex = explizit.map((g) => g.toLowerCase());
    if (ex.join("") !== klein) return null;
    const bekannt = new Set(inventar.map((i) => i.g));
    return ex.every((g) => bekannt.has(g)) ? ex : null;
  }
  const sortiert = nachLaengeSortiert(inventar);
  const ergebnis: string[] = [];
  let pos = 0;
  while (pos < klein.length) {
    const treffer = sortiert.find(
      (info) => !(info.nurWortanfang && pos > 0) && klein.startsWith(info.g, pos),
    );
    if (!treffer) return null;
    ergebnis.push(treffer.g);
    pos += treffer.g.length;
  }
  return ergebnis;
}

export function istLesbar(
  text: string,
  bekannt: ReadonlySet<string>,
  inventar: readonly GraphemInfo[],
  explizit?: readonly string[],
): boolean {
  const teile = zerlege(text, inventar, explizit);
  return teile !== null && teile.every((g) => bekannt.has(g));
}

export function grossschreiben(text: string): string {
  if (text.length === 0 || text.startsWith("ß")) return text;
  return text[0].toUpperCase() + text.slice(1);
}

export function istGesperrt(text: string, sperrliste: readonly string[]): boolean {
  const klein = text.toLowerCase();
  return sperrliste.some((s) => klein.includes(s));
}
