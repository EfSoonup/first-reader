import { testInhalte } from "./test-inhalte";
import type { GeneratorKontext } from "./typen";

/** Kontext für Tests; nutzt standardmäßig die feste Fixture `testInhalte`, nicht content/. */
export function testKontext(
  bekannt: string[],
  extra: Partial<Omit<GeneratorKontext, "bekannt">> = {},
): GeneratorKontext {
  return {
    bekannt: new Set(bekannt),
    neu: new Set(),
    kuerzlich: new Set(),
    wiederholungen: [],
    inhalte: testInhalte,
    ...extra,
  };
}
