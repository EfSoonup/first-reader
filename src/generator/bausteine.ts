import type { GraphemInfo, WortEintrag } from "../content/typen";
import { grossschreiben, istLesbar, zerlege } from "./grapheme";
import type { GeneratorKontext, LeseElement } from "./typen";

export function bekannteInfos(k: GeneratorKontext): GraphemInfo[] {
  return k.inhalte.inventar.filter((i) => k.bekannt.has(i.g));
}

export function silbenVokale(k: GeneratorKontext): GraphemInfo[] {
  return bekannteInfos(k).filter((i) => i.typ === "vokal");
}

export function silbenKonsonanten(k: GeneratorKontext): GraphemInfo[] {
  return bekannteInfos(k).filter((i) => i.typ === "konsonant" && i.silbe !== false);
}

/** Text muss sich genau in die gebauten Grapheme zurückzerlegen lassen (kein e+i → ei). */
export function passtZerlegung(text: string, teile: readonly string[], k: GeneratorKontext): boolean {
  const z = zerlege(text, k.inhalte.inventar);
  return z !== null && z.join("|") === teile.join("|");
}

export function buchstabenElemente(k: GeneratorKontext): LeseElement[] {
  const elemente: LeseElement[] = [];
  for (const info of bekannteInfos(k)) {
    elemente.push({ typ: "buchstabe", text: info.g });
    const gross = grossschreiben(info.g);
    if (gross !== info.g) elemente.push({ typ: "buchstabe", text: gross });
  }
  return elemente;
}

export function offeneSilben(k: GeneratorKontext): LeseElement[] {
  const elemente: LeseElement[] = [];
  for (const kon of silbenKonsonanten(k).filter((i) => i.anfang !== false)) {
    for (const vok of silbenVokale(k)) {
      const text = kon.g + vok.g;
      if (passtZerlegung(text, [kon.g, vok.g], k)) elemente.push({ typ: "silbe", text });
    }
  }
  return elemente;
}

export function geschlosseneSilben(k: GeneratorKontext): LeseElement[] {
  const elemente: LeseElement[] = [];
  const konsonanten = silbenKonsonanten(k).filter((i) => i.ende !== false && !i.nurWortanfang);
  for (const vok of silbenVokale(k)) {
    for (const kon of konsonanten) {
      const text = vok.g + kon.g;
      if (passtZerlegung(text, [vok.g, kon.g], k)) elemente.push({ typ: "silbe", text });
    }
  }
  return elemente;
}

export function lesbareWoerter(k: GeneratorKontext): WortEintrag[] {
  return k.inhalte.woerter.filter((w) =>
    istLesbar(w.text, k.bekannt, k.inhalte.inventar, w.zerlegung),
  );
}

export function woerterAlsElemente(k: GeneratorKontext): LeseElement[] {
  return lesbareWoerter(k).map((w) => ({ typ: "wort", text: w.text }));
}

export function elementWoerter(el: LeseElement): string[] {
  const texte = el.teile
    ? el.teile.flatMap((t) => (t.art === "text" ? [t.text] : []))
    : [el.text];
  return texte.flatMap((t) => t.split(" ")).filter((w) => w.length > 0);
}

export function elementIstLesbar(el: LeseElement, k: GeneratorKontext): boolean {
  const zerlegungen = new Map(k.inhalte.woerter.map((w) => [w.text.toLowerCase(), w.zerlegung]));
  return elementWoerter(el).every((w) =>
    istLesbar(w, k.bekannt, k.inhalte.inventar, zerlegungen.get(w.toLowerCase())),
  );
}
