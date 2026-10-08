import { abdeckung, REIHENFOLGEN } from "../src/content/abdeckung";
import { inhalte } from "../src/content";

// Aufruf: npm run coverage-content [-- <maxSchritte>]
const bis = Number(process.argv[2] ?? 20);

for (const r of REIHENFOLGEN) {
  console.log(`\n=== Reihenfolge ${r.name} … ===`);
  console.log(" Nr  Graphem  Wörter  Namen  Abbildbar  Bonus  Schablonen");
  for (const s of abdeckung(r.grapheme, inhalte).slice(0, bis)) {
    console.log(
      `${String(s.anzahl).padStart(3)}  ${s.graphem.toUpperCase().padEnd(7)}  ${String(s.woerter).padStart(6)}` +
        `  ${String(s.namen).padStart(5)}  ${String(s.abbildbar).padStart(9)}  ${(s.bonusFrei ? "frei" : "🔒").padEnd(5)}` +
        `  ${String(s.schablonen).padStart(10)}`,
    );
  }
}
console.log(
  `\nGesamt: ${inhalte.woerter.length} Einträge (${inhalte.woerter.filter((w) => w.typ === "name").length} Namen, ` +
    `${inhalte.woerter.filter((w) => w.emoji).length} abbildbar), ${inhalte.schablonen.length} Schablonen, ` +
    `${inhalte.bilder.length} Bilder.`,
);
