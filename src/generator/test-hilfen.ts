import { inhalte } from "../content";
import type { GeneratorKontext } from "./typen";

export function testKontext(
  bekannt: string[],
  extra: Partial<Omit<GeneratorKontext, "bekannt">> = {},
): GeneratorKontext {
  return {
    bekannt: new Set(bekannt),
    neu: new Set(),
    kuerzlich: new Set(),
    wiederholungen: [],
    inhalte,
    ...extra,
  };
}
