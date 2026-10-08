import { inhalte } from "../src/content";
import { pruefeInhalte } from "../src/content/pruefen";

const fehler = pruefeInhalte(inhalte);
if (fehler.length > 0) {
  console.error(`❌ ${fehler.length} Problem(e) in content/:`);
  for (const f of fehler) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  `✅ Inhalte ok: ${inhalte.woerter.length} Wörter, ${inhalte.bilder.length} Bilder, ` +
    `${inhalte.schablonen.length} Schablonen, ${inhalte.inventar.length} Grapheme.`,
);
