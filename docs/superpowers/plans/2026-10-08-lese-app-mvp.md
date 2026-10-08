# Lese-App MVP – Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine lokale Web-App, die aus den bekannten Buchstaben eines Leseanfängers täglich frisches Lesematerial erzeugt, die Lesezeit misst und das Kind mit Sternen, Stickern und Smileys motiviert.

**Architecture:** Statische Vite-App ohne Server. Eine reine, mit Seed reproduzierbare Generator-Schicht (`src/generator`) erzeugt Material aus JSON-Inhalten (`content/`). Eine reine Fortschritts-Schicht (`src/progress`) berechnet Zeit, Tageswerte und Belohnungen. `src/storage` persistiert alles in `localStorage`. React-Komponenten (`src/ui`) verbinden die Schichten.

**Tech Stack:** Node ≥ 20, Vite 8, React 19, TypeScript 5.9, Vitest 5 (+ jsdom, Testing Library), Motion 12+ (`motion/react`), `@fontsource/andika`, `tsx` für Skripte.

**Spec:** `docs/superpowers/specs/2026-10-08-lese-app-design.md`

## Global Constraints

- Privates Projekt: **niemals** zu Firmen-Servern pushen oder dort einen Remote anlegen; nur lokale Commits (siehe `AGENTS.md`).
- Commit-Messages auf Englisch; UI-Texte, Inhalte und Bezeichner (ohne Umlaute: `ae/oe/ue/ss`) auf Deutsch.
- Kein Backend, keine Netzwerkaufrufe zur Laufzeit; Schrift lokal über `@fontsource/andika`.
- Lesetext 48–64 px; Klickflächen mindestens 48 px; gedeckte Farben.
- Die App ist stumm (kein Ton).
- Kernregel: Kein generiertes Element enthält ein unbekanntes Graphem (Bildfelder ausgenommen).
- Aufwärmen: 8 Elemente, davon höchstens 4 aus dem Wiederholungsspeicher.
- Leerlauf-Pause: 60 s (Aufwärmen, Bonus), 5 min (Leseblatt).
- Tagesziel Standard: 10 Minuten aktive Lesezeit.
- Sterne: Aufwärm-✓ = 1, Blatt fertig = 5, Bonusrunde gelöst = 1.
- Bonus: 6 Runden, 3 Bilder, erst ab 4 abbildbaren lesbaren Wörtern.
- Sticker-Album: 30 Plätze, höchstens 1 Sticker pro Tag.
- Neue Grapheme: freigeschaltet in den letzten 7 Tagen → Gewicht ×3; Elemente der letzten 2 Sitzungen → Gewicht ×0,1.
- Sicherungs-Erinnerung nach 14 Tagen.
- TypeScript bewusst auf 5.x gepinnt (TS 7 ist der neue native Compiler; unnötiges Risiko fürs MVP).

## Review Focus

1. **Buchstabe wieder abgewählt:** Ein Eintrag im Wiederholungsspeicher, der dadurch unlesbar wird, darf im Aufwärmen nicht erscheinen. → Test in Task 7.
2. **Pseudowort bildet versehentlich ein Mehrbuchstaben-Graphem** (`s`+`ch` → `sch`, `e`+`i` → `ei`): Es wäre dann unlesbar. → Roundtrip-Test in Task 4.
3. **Kaputte Daten in `localStorage`:** Die Rohdaten dürfen nicht stillschweigend überschrieben werden; sie werden unter einem Sicherungsschlüssel abgelegt. → Test in Task 12.
4. **Browser mitten in der Sitzung geschlossen:** Zeit und Ergebnisse sind trotzdem gespeichert (Sitzung wird laufend per `upsertSitzung` gesichert). → Test in Task 11 + Verdrahtung in Task 15.
5. **Winzige Buchstabenmenge** (z. B. nur `m`, `a`): Generierung endet ohne Endlosschleife und liefert ein gültiges, ggf. kurzes Blatt. → Tests in Task 7.

## Dateistruktur

```
content/                     JSON-Inhalte (wachsen per Skill)
  grapheme.json  woerter.json  bilder.json  schablonen.json  sperrliste.json
scripts/check-content.ts     CLI-Prüfung der Inhalte
src/
  main.tsx  App.tsx  styles.css  test-setup.ts
  content/   typen.ts  index.ts  pruefen.ts
  generator/ rng.ts typen.ts grapheme.ts bausteine.ts pseudowoerter.ts
             bildsaetze.ts gewichtung.ts aufwaermen.ts leseblatt.ts bonus.ts
             index.ts test-hilfen.ts
  progress/  typen.ts zeit.ts auswertung.ts wiederholung.ts belohnungen.ts
             freischaltung.ts sitzung.ts kontext.ts ablauf.ts
  storage/   storage.ts
  ui/        useAppDaten.ts KinderStart.tsx Feier.tsx StickerAlbum.tsx SternZaehler.tsx
             Tagesreise.tsx Aufwaermen.tsx LeseblattAnsicht.tsx BonusSpiel.tsx Abschluss.tsx
             eltern/ Elternbereich.tsx Buchstaben.tsx Einstellungen.tsx
                     Protokoll.tsx Wochenuebersicht.tsx Sicherung.tsx
.claude/skills/neue-woerter/SKILL.md
```

Tests liegen neben dem Code als `*.test.ts(x)`. UI-Tests beginnen mit `// @vitest-environment jsdom`.

---

### Task 1: Projektgerüst und Zufallsgenerator

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `src/test-setup.ts`, `src/generator/rng.ts`
- Test: `src/generator/rng.test.ts`

**Interfaces:**
- Produces: `interface Rng { next(): number }`, `erzeugeRng(seed: number): Rng`, `zufallsInt(rng, max): number`, `waehle<T>(rng, liste: readonly T[]): T`, `mische<T>(rng, liste: readonly T[]): T[]`, `gewichteteAuswahl<T>(rng, eintraege: readonly { wert: T; gewicht: number }[], anzahl: number): T[]`

- [ ] **Step 1: Projektdateien anlegen** (kein `npm create vite`, weil der Ordner nicht leer ist)

`package.json`:
```json
{
  "name": "lese-app",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "check-content": "tsx scripts/check-content.ts"
  }
}
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "types": ["vite/client", "node"]
  },
  "include": ["src", "scripts", "vite.config.ts"]
}
```

`vite.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    setupFiles: ["./src/test-setup.ts"],
  },
});
```

`index.html`:
```html
<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lesestart</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`.gitignore`:
```
node_modules
dist
```

`src/test-setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

`src/main.tsx`:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/andika";
import "@fontsource/andika/700.css";
import "./styles.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`src/App.tsx` (Platzhalter, wird in Task 14 ersetzt):
```tsx
export default function App() {
  return <h1>Lesestart</h1>;
}
```

`src/styles.css`:
```css
:root {
  --schrift: "Andika", system-ui, sans-serif;
  --hintergrund: #fbf8f1;
  --karte: #ffffff;
  --text: #2d2a26;
  --leise: #8a8378;
  --akzent: #e0a63a;
  --gruen: #5f9e6e;
  --rot: #c8614f;
  --rand: #e7e0d2;
  --lesegroesse: 56px;
  --blattgroesse: 48px;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: var(--schrift);
  background: var(--hintergrund);
  color: var(--text);
}
button {
  font-family: inherit;
  font-size: 1.1rem;
  min-height: 48px;
  min-width: 48px;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  border: 2px solid var(--rand);
  background: var(--karte);
  cursor: pointer;
}
button.haupt { background: var(--akzent); border-color: var(--akzent); color: #fff; font-weight: 700; }
.seite { max-width: 960px; margin: 0 auto; padding: 16px; }
@media print { .nicht-drucken { display: none !important; } body { background: #fff; } }
```

- [ ] **Step 2: Abhängigkeiten installieren**

```bash
npm install react react-dom motion @fontsource/andika
npm install -D vite @vitejs/plugin-react typescript@5 @types/react @types/react-dom @types/node vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom tsx
```

- [ ] **Step 3: Failing test schreiben** – `src/generator/rng.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { erzeugeRng, gewichteteAuswahl, mische, waehle } from "./rng";

describe("rng", () => {
  it("liefert bei gleichem Seed dieselbe Folge", () => {
    const a = erzeugeRng(42);
    const b = erzeugeRng(42);
    const folgeA = Array.from({ length: 5 }, () => a.next());
    const folgeB = Array.from({ length: 5 }, () => b.next());
    expect(folgeA).toEqual(folgeB);
  });

  it("liefert bei anderem Seed eine andere Folge", () => {
    expect(erzeugeRng(1).next()).not.toEqual(erzeugeRng(2).next());
  });

  it("liefert Werte in [0, 1)", () => {
    const rng = erzeugeRng(7);
    for (let i = 0; i < 1000; i++) {
      const x = rng.next();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it("mische ist eine Permutation und verändert das Original nicht", () => {
    const original = [1, 2, 3, 4, 5];
    const ergebnis = mische(erzeugeRng(3), original);
    expect([...ergebnis].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(original).toEqual([1, 2, 3, 4, 5]);
  });

  it("waehle wirft bei leerer Liste", () => {
    expect(() => waehle(erzeugeRng(1), [])).toThrow();
  });

  it("gewichteteAuswahl zieht ohne Zurücklegen", () => {
    const eintraege = ["a", "b", "c"].map((wert) => ({ wert, gewicht: 1 }));
    const ergebnis = gewichteteAuswahl(erzeugeRng(5), eintraege, 10);
    expect([...ergebnis].sort()).toEqual(["a", "b", "c"]);
  });

  it("gewichteteAuswahl bevorzugt schwere Einträge", () => {
    const rng = erzeugeRng(9);
    const eintraege = [{ wert: "schwer", gewicht: 9 }, { wert: "leicht", gewicht: 1 }];
    let schwer = 0;
    for (let i = 0; i < 1000; i++) {
      if (gewichteteAuswahl(rng, eintraege, 1)[0] === "schwer") schwer++;
    }
    expect(schwer).toBeGreaterThan(800);
  });
});
```

- [ ] **Step 4: Test laufen lassen** – `npx vitest run src/generator/rng.test.ts` → FAIL (Modul fehlt)

- [ ] **Step 5: Implementieren** – `src/generator/rng.ts`

```ts
export interface Rng {
  next(): number;
}

/** mulberry32 – kleiner, reproduzierbarer Zufallsgenerator. */
export function erzeugeRng(seed: number): Rng {
  let a = seed >>> 0;
  return {
    next() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

export function zufallsInt(rng: Rng, max: number): number {
  return Math.floor(rng.next() * max);
}

export function waehle<T>(rng: Rng, liste: readonly T[]): T {
  if (liste.length === 0) throw new Error("waehle: leere Liste");
  return liste[zufallsInt(rng, liste.length)];
}

export function mische<T>(rng: Rng, liste: readonly T[]): T[] {
  const kopie = [...liste];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = zufallsInt(rng, i + 1);
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}

/** Zieht bis zu `anzahl` Werte ohne Zurücklegen, proportional zum Gewicht. */
export function gewichteteAuswahl<T>(
  rng: Rng,
  eintraege: readonly { wert: T; gewicht: number }[],
  anzahl: number,
): T[] {
  const rest = eintraege.filter((e) => e.gewicht > 0);
  const ergebnis: T[] = [];
  while (ergebnis.length < anzahl && rest.length > 0) {
    const summe = rest.reduce((s, e) => s + e.gewicht, 0);
    let ziel = rng.next() * summe;
    let index = 0;
    for (; index < rest.length - 1; index++) {
      ziel -= rest[index].gewicht;
      if (ziel < 0) break;
    }
    ergebnis.push(rest[index].wert);
    rest.splice(index, 1);
  }
  return ergebnis;
}
```

- [ ] **Step 6: Tests und Typprüfung** – `npm test && npm run typecheck` → PASS. Danach kurz `npm run dev` starten und prüfen, dass „Lesestart“ im Browser erscheint; Server beenden.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite React app and seeded RNG"
```

---

### Task 2: Inhaltstypen und Erstausstattung

**Files:**
- Create: `src/content/typen.ts`, `src/content/index.ts`, `content/grapheme.json`, `content/woerter.json`, `content/bilder.json`, `content/schablonen.json`, `content/sperrliste.json`
- Test: `src/content/index.test.ts`

**Interfaces:**
- Produces:
```ts
export type GraphemTyp = "vokal" | "konsonant";
export interface GraphemInfo {
  g: string;                 // klein geschrieben: "m", "sch", "ei"
  typ: GraphemTyp;
  anfang?: false;            // darf nicht am Silben-/Wortanfang stehen (ck, ß, ng, nk, ch)
  ende?: false;              // darf nicht am Wortende stehen (qu)
  nurWortanfang?: true;      // nur am Wortanfang ein Graphem (st, sp)
  silbe?: false;             // nicht für generierte Silben/Pseudowörter (c, x, y)
}
export interface WortEintrag { text: string; typ: "wort" | "name"; emoji?: string; kategorie?: string; zerlegung?: string[] }
export interface BildEintrag { emoji: string; wort: string; kategorie: string; etiketten: string[] }
export interface Schablone { id: string; teile: string[] }   // "[Name]", "[Ort-im]" … oder feste Wörter
export interface Inhalte { inventar: GraphemInfo[]; woerter: WortEintrag[]; bilder: BildEintrag[]; schablonen: Schablone[]; sperrliste: string[] }
// src/content/index.ts
export const inhalte: Inhalte;
```

- [ ] **Step 1: Typen anlegen** – `src/content/typen.ts` mit genau den Typen oben (jeweils `export`).

- [ ] **Step 2: Inhaltsdateien anlegen**

`content/grapheme.json`:
```json
[
  { "g": "a", "typ": "vokal" }, { "g": "e", "typ": "vokal" }, { "g": "i", "typ": "vokal" },
  { "g": "o", "typ": "vokal" }, { "g": "u", "typ": "vokal" }, { "g": "ä", "typ": "vokal" },
  { "g": "ö", "typ": "vokal" }, { "g": "ü", "typ": "vokal" }, { "g": "ei", "typ": "vokal" },
  { "g": "ie", "typ": "vokal" }, { "g": "au", "typ": "vokal" }, { "g": "eu", "typ": "vokal" },
  { "g": "äu", "typ": "vokal" },
  { "g": "b", "typ": "konsonant" }, { "g": "c", "typ": "konsonant", "silbe": false },
  { "g": "d", "typ": "konsonant" }, { "g": "f", "typ": "konsonant" }, { "g": "g", "typ": "konsonant" },
  { "g": "h", "typ": "konsonant" }, { "g": "j", "typ": "konsonant" }, { "g": "k", "typ": "konsonant" },
  { "g": "l", "typ": "konsonant" }, { "g": "m", "typ": "konsonant" }, { "g": "n", "typ": "konsonant" },
  { "g": "p", "typ": "konsonant" }, { "g": "r", "typ": "konsonant" }, { "g": "s", "typ": "konsonant" },
  { "g": "t", "typ": "konsonant" }, { "g": "v", "typ": "konsonant" }, { "g": "w", "typ": "konsonant" },
  { "g": "x", "typ": "konsonant", "silbe": false }, { "g": "y", "typ": "konsonant", "silbe": false },
  { "g": "z", "typ": "konsonant" }, { "g": "ß", "typ": "konsonant", "anfang": false },
  { "g": "ch", "typ": "konsonant", "anfang": false }, { "g": "sch", "typ": "konsonant" },
  { "g": "ck", "typ": "konsonant", "anfang": false }, { "g": "pf", "typ": "konsonant" },
  { "g": "qu", "typ": "konsonant", "ende": false }, { "g": "ng", "typ": "konsonant", "anfang": false },
  { "g": "nk", "typ": "konsonant", "anfang": false },
  { "g": "st", "typ": "konsonant", "nurWortanfang": true },
  { "g": "sp", "typ": "konsonant", "nurWortanfang": true }
]
```

`content/woerter.json`:
```json
[
  { "text": "am", "typ": "wort" },
  { "text": "im", "typ": "wort" },
  { "text": "Mama", "typ": "name", "emoji": "👩", "kategorie": "Familie" },
  { "text": "Mami", "typ": "name" },
  { "text": "Mia", "typ": "name" },
  { "text": "Mimi", "typ": "name" }
]
```

`content/bilder.json`:
```json
[
  { "emoji": "🚂", "wort": "Zug", "kategorie": "Fahrzeuge", "etiketten": ["Ort-im"] },
  { "emoji": "🚗", "wort": "Auto", "kategorie": "Fahrzeuge", "etiketten": ["Ort-im", "Ding"] },
  { "emoji": "✈️", "wort": "Flugzeug", "kategorie": "Fahrzeuge", "etiketten": ["Ort-im"] },
  { "emoji": "🚌", "wort": "Bus", "kategorie": "Fahrzeuge", "etiketten": ["Ort-im"] },
  { "emoji": "🏠", "wort": "Haus", "kategorie": "Orte", "etiketten": ["Ort-im", "Ding"] },
  { "emoji": "🛁", "wort": "Bad", "kategorie": "Orte", "etiketten": ["Ort-im"] },
  { "emoji": "🌲", "wort": "Wald", "kategorie": "Natur", "etiketten": ["Ort-im"] },
  { "emoji": "🏰", "wort": "Schloss", "kategorie": "Orte", "etiketten": ["Ort-im", "Ding"] },
  { "emoji": "⛺", "wort": "Zelt", "kategorie": "Orte", "etiketten": ["Ort-im"] },
  { "emoji": "🛏️", "wort": "Bett", "kategorie": "Dinge", "etiketten": ["Ort-im"] },
  { "emoji": "🌧️", "wort": "Regen", "kategorie": "Wetter", "etiketten": ["Ort-im"] },
  { "emoji": "💧", "wort": "Wasser", "kategorie": "Natur", "etiketten": ["Ort-im"] },
  { "emoji": "🎪", "wort": "Zirkus", "kategorie": "Orte", "etiketten": ["Ort-im"] },
  { "emoji": "❄️", "wort": "Schnee", "kategorie": "Wetter", "etiketten": ["Ort-im"] },
  { "emoji": "🌊", "wort": "Meer", "kategorie": "Natur", "etiketten": ["Ort-am"] },
  { "emoji": "🏖️", "wort": "Strand", "kategorie": "Natur", "etiketten": ["Ort-am"] },
  { "emoji": "🏔️", "wort": "Berg", "kategorie": "Natur", "etiketten": ["Ort-am"] },
  { "emoji": "🌳", "wort": "Baum", "kategorie": "Natur", "etiketten": ["Ort-am", "Ding"] },
  { "emoji": "🥅", "wort": "Tor", "kategorie": "Dinge", "etiketten": ["Ort-am"] },
  { "emoji": "🏞️", "wort": "See", "kategorie": "Natur", "etiketten": ["Ort-am"] },
  { "emoji": "🔥", "wort": "Feuer", "kategorie": "Natur", "etiketten": ["Ort-am"] },
  { "emoji": "🪟", "wort": "Fenster", "kategorie": "Dinge", "etiketten": ["Ort-am"] },
  { "emoji": "🎡", "wort": "Riesenrad", "kategorie": "Orte", "etiketten": ["Ort-am"] },
  { "emoji": "🌞", "wort": "Sonne", "kategorie": "Wetter", "etiketten": ["Ding"] },
  { "emoji": "🌈", "wort": "Regenbogen", "kategorie": "Wetter", "etiketten": ["Ding"] },
  { "emoji": "🐱", "wort": "Katze", "kategorie": "Tiere", "etiketten": ["Ding"] },
  { "emoji": "🐶", "wort": "Hund", "kategorie": "Tiere", "etiketten": ["Ding"] },
  { "emoji": "🌸", "wort": "Blume", "kategorie": "Natur", "etiketten": ["Ding"] },
  { "emoji": "⭐", "wort": "Stern", "kategorie": "Dinge", "etiketten": ["Ding"] },
  { "emoji": "🍎", "wort": "Apfel", "kategorie": "Essen", "etiketten": ["Ding"] }
]
```

`content/schablonen.json`:
```json
[
  { "id": "name-im", "teile": ["[Name]", "im", "[Ort-im]"] },
  { "id": "name-am", "teile": ["[Name]", "am", "[Ort-am]"] },
  { "id": "name-malt", "teile": ["[Name]", "malt", "[Ding]"] },
  { "id": "oma-ist-im", "teile": ["Oma", "ist", "im", "[Ort-im]"] }
]
```

`content/sperrliste.json`:
```json
["arsch", "kack", "fick", "fotz", "hure", "nutte", "nazi", "sex", "pimmel", "pipi", "popo", "pups", "wichs", "schei", "kot", "tot", "mist", "doof", "blöd", "puff"]
```

- [ ] **Step 3: Failing test** – `src/content/index.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { inhalte } from "./index";

describe("inhalte", () => {
  it("lädt alle Inhaltsdateien", () => {
    expect(inhalte.inventar.length).toBeGreaterThan(40);
    expect(inhalte.woerter.map((w) => w.text)).toContain("Mama");
    expect(inhalte.bilder).toHaveLength(30);
    expect(inhalte.schablonen.map((s) => s.id)).toContain("name-im");
    expect(inhalte.sperrliste).toContain("kack");
  });

  it("Grapheme sind klein geschrieben und eindeutig", () => {
    const gs = inhalte.inventar.map((i) => i.g);
    expect(new Set(gs).size).toBe(gs.length);
    for (const g of gs) expect(g).toBe(g.toLowerCase());
  });
});
```

- [ ] **Step 4:** `npx vitest run src/content` → FAIL

- [ ] **Step 5: Implementieren** – `src/content/index.ts`

```ts
import inventar from "../../content/grapheme.json";
import woerter from "../../content/woerter.json";
import bilder from "../../content/bilder.json";
import schablonen from "../../content/schablonen.json";
import sperrliste from "../../content/sperrliste.json";
import type { BildEintrag, GraphemInfo, Inhalte, Schablone, WortEintrag } from "./typen";

export const inhalte: Inhalte = {
  inventar: inventar as GraphemInfo[],
  woerter: woerter as WortEintrag[],
  bilder: bilder as BildEintrag[],
  schablonen: schablonen as Schablone[],
  sperrliste: sperrliste as string[],
};

export type * from "./typen";
```

- [ ] **Step 6:** `npm test && npm run typecheck` → PASS

- [ ] **Step 7: Commit** – `git add -A && git commit -m "feat: add content types and initial content"`

---

### Task 3: Graphem-Zerlegung und Lesbarkeit

**Files:**
- Create: `src/generator/grapheme.ts`
- Test: `src/generator/grapheme.test.ts`

**Interfaces:**
- Consumes: `GraphemInfo` (Task 2)
- Produces:
```ts
export function zerlege(text: string, inventar: readonly GraphemInfo[], explizit?: readonly string[]): string[] | null;
export function istLesbar(text: string, bekannt: ReadonlySet<string>, inventar: readonly GraphemInfo[], explizit?: readonly string[]): boolean;
export function grossschreiben(text: string): string;
export function istGesperrt(text: string, sperrliste: readonly string[]): boolean;
```

- [ ] **Step 1: Failing test** – `src/generator/grapheme.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { inhalte } from "../content";
import { grossschreiben, istGesperrt, istLesbar, zerlege } from "./grapheme";

const inv = inhalte.inventar;

describe("zerlege", () => {
  it.each([
    ["Mama", ["m", "a", "m", "a"]],
    ["Schule", ["sch", "u", "l", "e"]],
    ["Eis", ["ei", "s"]],
    ["Stein", ["st", "ei", "n"]],
    ["Mist", ["m", "i", "s", "t"]],
    ["ist", ["i", "s", "t"]],
    ["Bäcker", ["b", "ä", "ck", "e", "r"]],
    ["MAMA", ["m", "a", "m", "a"]],
  ])("%s", (text, erwartet) => {
    expect(zerlege(text, inv)).toEqual(erwartet);
  });

  it("nutzt eine explizite Zerlegung", () => {
    const ex = ["f", "a", "m", "i", "l", "i", "e"];
    expect(zerlege("Familie", inv, ex)).toEqual(ex);
    expect(zerlege("Familie", inv)?.at(-1)).toBe("ie");
  });

  it("lehnt explizite Zerlegung ab, die nicht zum Text passt", () => {
    expect(zerlege("Mama", inv, ["m", "a"])).toBeNull();
  });

  it("liefert null bei unbekannten Zeichen", () => {
    expect(zerlege("Pizza1", inv)).toBeNull();
    expect(zerlege("", inv)).toBeNull();
  });
});

describe("istLesbar", () => {
  it("prüft gegen bekannte Grapheme, unabhängig von Groß/klein", () => {
    const bekannt = new Set(["m", "i", "a"]);
    expect(istLesbar("Mia", bekannt, inv)).toBe(true);
    expect(istLesbar("MAMA", bekannt, inv)).toBe(true);
    expect(istLesbar("Oma", bekannt, inv)).toBe(false);
  });

  it("verlangt Mehrbuchstaben-Grapheme", () => {
    expect(istLesbar("Schaf", new Set(["s", "c", "h", "a", "f"]), inv)).toBe(false);
    expect(istLesbar("Schaf", new Set(["sch", "a", "f"]), inv)).toBe(true);
  });
});

describe("grossschreiben", () => {
  it.each([["sch", "Sch"], ["ei", "Ei"], ["ma", "Ma"], ["ß", "ß"], ["", ""]])("%s", (ein, aus) => {
    expect(grossschreiben(ein)).toBe(aus);
  });
});

describe("istGesperrt", () => {
  it("findet Sperrwörter als Teilstring, unabhängig von Groß/klein", () => {
    expect(istGesperrt("Kacka", ["kack"])).toBe(true);
    expect(istGesperrt("Mimi", ["kack"])).toBe(false);
  });
});
```

- [ ] **Step 2:** `npx vitest run src/generator/grapheme.test.ts` → FAIL

- [ ] **Step 3: Implementieren** – `src/generator/grapheme.ts`

```ts
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
```

- [ ] **Step 4:** `npx vitest run src/generator/grapheme.test.ts` → PASS

- [ ] **Step 5: Commit** – `git add -A && git commit -m "feat: add grapheme segmentation and readability check"`

---

### Task 4: Element-Typen, Bausteine (Buchstaben, Silben, Wörter) und Pseudowörter

**Files:**
- Create: `src/generator/typen.ts`, `src/generator/bausteine.ts`, `src/generator/pseudowoerter.ts`, `src/generator/test-hilfen.ts`
- Test: `src/generator/bausteine.test.ts`, `src/generator/pseudowoerter.test.ts`

**Interfaces:**
- Consumes: `Inhalte`, `GraphemInfo`, `WortEintrag` (Task 2); `zerlege`, `istLesbar`, `grossschreiben`, `istGesperrt` (Task 3); `Rng`, `waehle` (Task 1)
- Produces:
```ts
// typen.ts
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
// bausteine.ts
export function bekannteInfos(k: GeneratorKontext): GraphemInfo[];
export function silbenVokale(k: GeneratorKontext): GraphemInfo[];
export function silbenKonsonanten(k: GeneratorKontext): GraphemInfo[];
export function buchstabenElemente(k: GeneratorKontext): LeseElement[];
export function offeneSilben(k: GeneratorKontext): LeseElement[];
export function geschlosseneSilben(k: GeneratorKontext): LeseElement[];
export function lesbareWoerter(k: GeneratorKontext): WortEintrag[];
export function woerterAlsElemente(k: GeneratorKontext): LeseElement[];
export function elementWoerter(el: LeseElement): string[];
export function elementIstLesbar(el: LeseElement, k: GeneratorKontext): boolean;
// pseudowoerter.ts
export const LANG_AB = 10;
export function erzeugePseudowort(k: GeneratorKontext, rng: Rng): LeseElement | null;
export function erzeugePseudowoerter(k: GeneratorKontext, rng: Rng, anzahl: number): LeseElement[];
// test-hilfen.ts
export function testKontext(bekannt: string[], extra?: Partial<Omit<GeneratorKontext, "bekannt">>): GeneratorKontext;
```

- [ ] **Step 1: Typen und Testhilfe anlegen**

`src/generator/typen.ts`: genau die Typen aus „Produces / typen.ts“ oben, mit `import type { Inhalte } from "../content/typen";`.

`src/generator/test-hilfen.ts`:
```ts
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
```

- [ ] **Step 2: Failing tests** – `src/generator/bausteine.test.ts`

```ts
import { describe, expect, it } from "vitest";
import {
  buchstabenElemente, elementIstLesbar, geschlosseneSilben, offeneSilben, woerterAlsElemente,
} from "./bausteine";
import { testKontext } from "./test-hilfen";

const texte = (els: { text: string }[]) => els.map((e) => e.text).sort();

describe("bausteine", () => {
  it("Buchstaben groß und klein", () => {
    expect(texte(buchstabenElemente(testKontext(["m", "i", "a"])))).toEqual(
      ["A", "I", "M", "a", "i", "m"],
    );
  });

  it("ß nur klein, sch als Sch", () => {
    expect(texte(buchstabenElemente(testKontext(["ß", "sch"])))).toEqual(["Sch", "sch", "ß"]);
  });

  it("offene und geschlossene Silben aus M, I, A", () => {
    const k = testKontext(["m", "i", "a"]);
    expect(texte(offeneSilben(k))).toEqual(["ma", "mi"]);
    expect(texte(geschlosseneSilben(k))).toEqual(["am", "im"]);
    expect(offeneSilben(k).every((e) => e.typ === "silbe")).toBe(true);
  });

  it("ck nicht am Anfang, st nur am Anfang", () => {
    expect(texte(offeneSilben(testKontext(["a", "ck"])))).toEqual([]);
    expect(texte(geschlosseneSilben(testKontext(["a", "ck"])))).toEqual(["ack"]);
    expect(texte(offeneSilben(testKontext(["a", "st"])))).toEqual(["sta"]);
    expect(texte(geschlosseneSilben(testKontext(["a", "st"])))).toEqual([]);
  });

  it("c, x, y erzeugen keine Silben", () => {
    expect(offeneSilben(testKontext(["a", "c", "x", "y"]))).toEqual([]);
  });

  it("nur lesbare Wörter aus der Wortliste", () => {
    expect(texte(woerterAlsElemente(testKontext(["m", "i", "a"])))).toEqual(
      ["Mama", "Mami", "Mia", "Mimi", "am", "im"],
    );
    expect(texte(woerterAlsElemente(testKontext(["m", "a"])))).toEqual(["Mama", "am"]);
  });

  it("elementIstLesbar prüft bei Sätzen nur die Textteile", () => {
    const k = testKontext(["m", "i", "a"]);
    const satz = {
      typ: "satz" as const,
      text: "Mia im 🚂",
      teile: [
        { art: "text" as const, text: "Mia" },
        { art: "text" as const, text: "im" },
        { art: "bild" as const, emoji: "🚂", wort: "Zug" },
      ],
    };
    expect(elementIstLesbar(satz, k)).toBe(true);
    expect(elementIstLesbar({ typ: "wort", text: "Oma" }, k)).toBe(false);
  });
});
```

`src/generator/pseudowoerter.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { inhalte } from "../content";
import { zerlege } from "./grapheme";
import { erzeugePseudowoerter, erzeugePseudowort } from "./pseudowoerter";
import { erzeugeRng } from "./rng";
import { testKontext } from "./test-hilfen";

function viele(bekannt: string[], seeds = 300, extra = {}) {
  const k = testKontext(bekannt, extra);
  const ergebnis = [];
  for (let s = 0; s < seeds; s++) {
    const el = erzeugePseudowort(k, erzeugeRng(s));
    if (el) ergebnis.push(el);
  }
  return ergebnis;
}

describe("Pseudowörter", () => {
  it("bestehen nur aus bekannten Graphemen und sind großgeschrieben", () => {
    const bekannt = ["m", "i", "a"];
    const els = viele(bekannt);
    expect(els.length).toBeGreaterThan(250);
    for (const el of els) {
      const z = zerlege(el.text, inhalte.inventar)!;
      expect(z.every((g) => bekannt.includes(g))).toBe(true);
      if (el.typ === "pseudowort") expect(el.text[0]).toBe(el.text[0].toUpperCase());
    }
  });

  it("haben höchstens 2 Silben (≤ 5 Grapheme), solange < 10 Grapheme bekannt sind", () => {
    for (const el of viele(["m", "i", "a", "l", "o"])) {
      expect(zerlege(el.text, inhalte.inventar)!.length).toBeLessThanOrEqual(5);
    }
  });

  it("haben ab 10 Graphemen auch 3 Silben und höchstens 2 Konsonanten in Folge", () => {
    const bekannt = ["m", "i", "a", "l", "o", "t", "n", "e", "s", "r", "u", "f"];
    const typ = new Map(inhalte.inventar.map((i) => [i.g, i.typ]));
    const els = viele(bekannt, 500);
    expect(els.some((el) => zerlege(el.text, inhalte.inventar)!.length > 5)).toBe(true);
    for (const el of els) {
      const folge = zerlege(el.text, inhalte.inventar)!.map((g) => typ.get(g)).join(",");
      expect(folge).not.toContain("konsonant,konsonant,konsonant");
    }
  });

  it("bilden keine ungewollten Mehrbuchstaben-Grapheme (e+i → ei)", () => {
    const bekannt = ["m", "e", "i"];
    for (const el of viele(bekannt, 500)) {
      const z = zerlege(el.text, inhalte.inventar)!;
      expect(z.every((g) => bekannt.includes(g))).toBe(true);
    }
  });

  it("bilden kein s+ch → sch", () => {
    const bekannt = ["s", "ch", "a", "m", "i", "o", "l", "t", "n", "e"];
    for (const el of viele(bekannt, 500)) {
      const z = zerlege(el.text, inhalte.inventar)!;
      expect(z.every((g) => bekannt.includes(g))).toBe(true);
    }
  });

  it("respektieren die Sperrliste", () => {
    for (const el of viele(["m", "i", "a"], 300, { inhalte: { ...inhalte, sperrliste: ["mim"] } })) {
      expect(el.text.toLowerCase()).not.toContain("mim");
    }
  });

  it("behandeln Treffer in der Wortliste als echtes Wort", () => {
    const mama = viele(["m", "a"], 500).filter((e) => e.text.toLowerCase() === "mama");
    expect(mama.length).toBeGreaterThan(0);
    for (const el of mama) expect(el).toEqual({ typ: "wort", text: "Mama" });
  });

  it("liefern nichts ohne Vokal", () => {
    expect(erzeugePseudowort(testKontext(["m", "l"]), erzeugeRng(1))).toBeNull();
    expect(erzeugePseudowoerter(testKontext(["m", "l"]), erzeugeRng(1), 5)).toEqual([]);
  });

  it("erzeugePseudowoerter liefert eindeutige Texte", () => {
    const els = erzeugePseudowoerter(testKontext(["m", "i", "a", "l", "o"]), erzeugeRng(4), 15);
    expect(els.length).toBe(15);
    expect(new Set(els.map((e) => e.text.toLowerCase())).size).toBe(15);
  });
});
```

- [ ] **Step 3:** `npx vitest run src/generator` → FAIL (Module fehlen)

- [ ] **Step 4: Implementieren** – `src/generator/bausteine.ts`

```ts
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
```

`src/generator/pseudowoerter.ts`:
```ts
import { grossschreiben, istGesperrt } from "./grapheme";
import { passtZerlegung, silbenKonsonanten, silbenVokale } from "./bausteine";
import { waehle, type Rng } from "./rng";
import type { GeneratorKontext, LeseElement } from "./typen";

type Form = "KV" | "V" | "KVK";

const MUSTER_KURZ: Form[][] = [["KV", "KV"], ["V", "KV"], ["KV", "V"], ["KV", "KVK"]];
const MUSTER_LANG: Form[][] = [
  ["KV", "KV", "KV"], ["V", "KV", "KV"], ["KV", "KV", "KVK"], // 3 Silben
  ["KVK", "KV"], ["V", "KVK", "KV"],                         // mit Konsonantenhäufung (max. 2)
];
export const LANG_AB = 10;
const VERSUCHE = 20;

function baueGrapheme(muster: Form[], k: GeneratorKontext, rng: Rng): string[] | null {
  const vokale = silbenVokale(k);
  const konsonanten = silbenKonsonanten(k);
  const folge = muster.flatMap((f) => f.split("")) as ("K" | "V")[];
  const teile: string[] = [];
  for (let i = 0; i < folge.length; i++) {
    const erstes = i === 0;
    const letztes = i === folge.length - 1;
    const pool =
      folge[i] === "V"
        ? vokale
        : konsonanten.filter(
            (info) =>
              (!erstes || info.anfang !== false) &&
              (!letztes || info.ende !== false) &&
              (erstes || !info.nurWortanfang),
          );
    if (pool.length === 0) return null;
    teile.push(waehle(rng, pool).g);
  }
  return teile;
}

export function erzeugePseudowort(k: GeneratorKontext, rng: Rng): LeseElement | null {
  if (silbenVokale(k).length === 0 || silbenKonsonanten(k).length === 0) return null;
  const muster = k.bekannt.size >= LANG_AB ? [...MUSTER_KURZ, ...MUSTER_LANG] : MUSTER_KURZ;
  const echteWoerter = new Map(k.inhalte.woerter.map((w) => [w.text.toLowerCase(), w]));
  for (let versuch = 0; versuch < VERSUCHE; versuch++) {
    const teile = baueGrapheme(waehle(rng, muster), k, rng);
    if (!teile) continue;
    const text = teile.join("");
    if (!passtZerlegung(text, teile, k)) continue;
    if (istGesperrt(text, k.inhalte.sperrliste)) continue;
    const echt = echteWoerter.get(text);
    if (echt) return { typ: "wort", text: echt.text };
    return { typ: "pseudowort", text: grossschreiben(text) };
  }
  return null;
}

export function erzeugePseudowoerter(k: GeneratorKontext, rng: Rng, anzahl: number): LeseElement[] {
  const ergebnis = new Map<string, LeseElement>();
  for (let versuch = 0; versuch < anzahl * VERSUCHE && ergebnis.size < anzahl; versuch++) {
    const el = erzeugePseudowort(k, rng);
    if (!el) {
      if (silbenVokale(k).length === 0 || silbenKonsonanten(k).length === 0) break;
      continue;
    }
    ergebnis.set(el.text.toLowerCase(), el);
  }
  return [...ergebnis.values()];
}
```

Ergänze in der „Produces“-Liste gedanklich: `passtZerlegung(text, teile, k): boolean` ist ebenfalls aus `bausteine.ts` exportiert.

- [ ] **Step 5:** `npx vitest run src/generator` → PASS. Falls „eindeutige Texte“ mit 15 knapp scheitert: Grapheme sind M, I, A, L, O → genug Kombinationen; nicht die Testzahl senken, sondern Fehler suchen.

- [ ] **Step 6: Commit** – `git add -A && git commit -m "feat: generate letters, syllables, real words and pseudowords"`

---

### Task 5: Bildsätze

**Files:**
- Create: `src/generator/bildsaetze.ts`
- Test: `src/generator/bildsaetze.test.ts`

**Interfaces:**
- Consumes: `Schablone`, `WortEintrag` (Task 2); `istLesbar`, `grossschreiben` (Task 3); `lesbareWoerter`, `LeseElement`, `SatzTeil`, `GeneratorKontext` (Task 4); `Rng`, `waehle` (Task 1)
- Produces:
```ts
export const NAME_PLATZHALTER = "[Name]";
export function istPlatzhalter(teil: string): boolean;          // beginnt mit "["
export function bildEtikett(teil: string): string | null;       // "[Ort-im]" → "Ort-im"; "[Name]"/fest → null
export function lesbareNamen(k: GeneratorKontext): WortEintrag[];
export function nutzbareSchablonen(k: GeneratorKontext): Schablone[];
export function erzeugeBildsatz(k: GeneratorKontext, rng: Rng, schablone: Schablone): LeseElement;
export function erzeugeBildsaetze(k: GeneratorKontext, rng: Rng, anzahl: number): LeseElement[];
```

- [ ] **Step 1: Failing test** – `src/generator/bildsaetze.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { inhalte } from "../content";
import { erzeugeBildsatz, erzeugeBildsaetze, nutzbareSchablonen } from "./bildsaetze";
import { elementIstLesbar } from "./bausteine";
import { erzeugeRng } from "./rng";
import { testKontext } from "./test-hilfen";

const ids = (k: Parameters<typeof nutzbareSchablonen>[0]) => nutzbareSchablonen(k).map((s) => s.id).sort();

describe("Bildsätze", () => {
  it("mit M, I, A nur die im/am-Schablonen", () => {
    expect(ids(testKontext(["m", "i", "a"]))).toEqual(["name-am", "name-im"]);
  });

  it("schaltet Schablonen mit neuen Buchstaben frei", () => {
    const k = testKontext(["m", "i", "a", "l", "t", "o", "s"]);
    expect(ids(k)).toEqual(["name-am", "name-im", "name-malt", "oma-ist-im"]);
  });

  it("ohne lesbaren Namen keine [Name]-Schablonen", () => {
    const ohneNamen = { ...inhalte, woerter: inhalte.woerter.filter((w) => w.typ !== "name") };
    expect(ids(testKontext(["m", "i", "a"], { inhalte: ohneNamen }))).toEqual([]);
  });

  it("ohne passendes Bild ist die Schablone nicht nutzbar", () => {
    const ohneAm = { ...inhalte, bilder: inhalte.bilder.filter((b) => !b.etiketten.includes("Ort-am")) };
    expect(ids(testKontext(["m", "i", "a"], { inhalte: ohneAm }))).toEqual(["name-im"]);
  });

  it("erzeugt lesbare Sätze mit passendem Bild und großem Anfang", () => {
    const k = testKontext(["m", "i", "a"]);
    const schablone = inhalte.schablonen.find((s) => s.id === "name-im")!;
    for (let s = 0; s < 100; s++) {
      const satz = erzeugeBildsatz(k, erzeugeRng(s), schablone);
      expect(satz.typ).toBe("satz");
      expect(elementIstLesbar(satz, k)).toBe(true);
      const bild = satz.teile!.find((t) => t.art === "bild")!;
      if (bild.art !== "bild") throw new Error("kein Bild");
      const eintrag = inhalte.bilder.find((b) => b.emoji === bild.emoji)!;
      expect(eintrag.etiketten).toContain("Ort-im");
      expect(satz.text[0]).toBe(satz.text[0].toUpperCase());
      expect(satz.text).toContain(bild.emoji);
    }
  });

  it("schreibt feste Wörter am Satzanfang groß", () => {
    const k = testKontext(["m", "i", "a", "l", "t", "o", "s"]);
    const schablone = inhalte.schablonen.find((s) => s.id === "oma-ist-im")!;
    expect(erzeugeBildsatz(k, erzeugeRng(1), schablone).text.startsWith("Oma ist im ")).toBe(true);
  });

  it("erzeugeBildsaetze liefert eindeutige Sätze", () => {
    const saetze = erzeugeBildsaetze(testKontext(["m", "i", "a"]), erzeugeRng(2), 5);
    expect(saetze).toHaveLength(5);
    expect(new Set(saetze.map((s) => s.text)).size).toBe(5);
  });

  it("erzeugeBildsaetze liefert [] ohne nutzbare Schablone", () => {
    expect(erzeugeBildsaetze(testKontext(["o"]), erzeugeRng(2), 5)).toEqual([]);
  });
});
```

- [ ] **Step 2:** `npx vitest run src/generator/bildsaetze.test.ts` → FAIL

- [ ] **Step 3: Implementieren** – `src/generator/bildsaetze.ts`

```ts
import type { Schablone, WortEintrag } from "../content/typen";
import { lesbareWoerter } from "./bausteine";
import { grossschreiben, istLesbar } from "./grapheme";
import { waehle, type Rng } from "./rng";
import type { GeneratorKontext, LeseElement, SatzTeil } from "./typen";

export const NAME_PLATZHALTER = "[Name]";

export function istPlatzhalter(teil: string): boolean {
  return teil.startsWith("[") && teil.endsWith("]");
}

export function bildEtikett(teil: string): string | null {
  if (!istPlatzhalter(teil) || teil === NAME_PLATZHALTER) return null;
  return teil.slice(1, -1);
}

export function lesbareNamen(k: GeneratorKontext): WortEintrag[] {
  return lesbareWoerter(k).filter((w) => w.typ === "name");
}

function bilderMit(k: GeneratorKontext, etikett: string) {
  return k.inhalte.bilder.filter((b) => b.etiketten.includes(etikett));
}

export function nutzbareSchablonen(k: GeneratorKontext): Schablone[] {
  const namenDa = lesbareNamen(k).length > 0;
  return k.inhalte.schablonen.filter((s) =>
    s.teile.every((teil) => {
      if (teil === NAME_PLATZHALTER) return namenDa;
      const etikett = bildEtikett(teil);
      if (etikett !== null) return bilderMit(k, etikett).length > 0;
      return istLesbar(teil, k.bekannt, k.inhalte.inventar);
    }),
  );
}

export function erzeugeBildsatz(k: GeneratorKontext, rng: Rng, schablone: Schablone): LeseElement {
  const namen = lesbareNamen(k);
  const teile: SatzTeil[] = schablone.teile.map((teil) => {
    if (teil === NAME_PLATZHALTER) return { art: "text", text: waehle(rng, namen).text };
    const etikett = bildEtikett(teil);
    if (etikett !== null) {
      const bild = waehle(rng, bilderMit(k, etikett));
      return { art: "bild", emoji: bild.emoji, wort: bild.wort };
    }
    return { art: "text", text: teil };
  });
  const erstes = teile[0];
  if (erstes.art === "text") teile[0] = { art: "text", text: grossschreiben(erstes.text) };
  const text = teile.map((t) => (t.art === "text" ? t.text : t.emoji)).join(" ");
  return { typ: "satz", text, teile };
}

export function erzeugeBildsaetze(k: GeneratorKontext, rng: Rng, anzahl: number): LeseElement[] {
  const schablonen = nutzbareSchablonen(k);
  if (schablonen.length === 0) return [];
  const ergebnis = new Map<string, LeseElement>();
  for (let versuch = 0; versuch < anzahl * 20 && ergebnis.size < anzahl; versuch++) {
    const satz = erzeugeBildsatz(k, rng, waehle(rng, schablonen));
    ergebnis.set(satz.text, satz);
  }
  return [...ergebnis.values()];
}
```

- [ ] **Step 4:** `npx vitest run src/generator/bildsaetze.test.ts` → PASS

- [ ] **Step 5: Commit** – `git add -A && git commit -m "feat: generate picture sentences from templates"`

---

### Task 6: Gewichtung (neue Grapheme, Frische)

**Files:**
- Create: `src/generator/gewichtung.ts`
- Test: `src/generator/gewichtung.test.ts`

**Interfaces:**
- Consumes: `elementWoerter` (Task 4), `zerlege` (Task 3), `gewichteteAuswahl` (Task 1)
- Produces:
```ts
export const GEWICHT_NEU = 3;
export const GEWICHT_KUERZLICH = 0.1;
export function enthaeltNeuesGraphem(el: LeseElement, k: GeneratorKontext): boolean;
export function gewicht(el: LeseElement, k: GeneratorKontext): number;
export function gewichteteElemente(k: GeneratorKontext, rng: Rng, kandidaten: readonly LeseElement[], anzahl: number): LeseElement[];
```

- [ ] **Step 1: Failing test** – `src/generator/gewichtung.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { enthaeltNeuesGraphem, gewicht, gewichteteElemente } from "./gewichtung";
import { erzeugeRng } from "./rng";
import { testKontext } from "./test-hilfen";
import type { LeseElement } from "./typen";

const mi: LeseElement = { typ: "silbe", text: "mi" };
const ma: LeseElement = { typ: "silbe", text: "ma" };

describe("Gewichtung", () => {
  it("erkennt neue Grapheme", () => {
    const k = testKontext(["m", "i", "a"], { neu: new Set(["i"]) });
    expect(enthaeltNeuesGraphem(mi, k)).toBe(true);
    expect(enthaeltNeuesGraphem(ma, k)).toBe(false);
  });

  it("berechnet Gewichte", () => {
    const k = testKontext(["m", "i", "a"], { neu: new Set(["i"]), kuerzlich: new Set(["mi", "ma"]) });
    expect(gewicht(mi, k)).toBeCloseTo(0.3);
    expect(gewicht(ma, k)).toBeCloseTo(0.1);
    expect(gewicht(ma, testKontext(["m", "i", "a"]))).toBe(1);
  });

  it("zieht neue Grapheme häufiger", () => {
    const k = testKontext(["m", "i", "a"], { neu: new Set(["i"]) });
    const rng = erzeugeRng(11);
    let treffer = 0;
    for (let i = 0; i < 2000; i++) {
      if (gewichteteElemente(k, rng, [mi, ma], 1)[0].text === "mi") treffer++;
    }
    expect(treffer / 2000).toBeGreaterThan(0.65);
  });

  it("zieht kürzlich Gezeigtes seltener", () => {
    const k = testKontext(["m", "i", "a"], { kuerzlich: new Set(["mi"]) });
    const rng = erzeugeRng(12);
    let treffer = 0;
    for (let i = 0; i < 2000; i++) {
      if (gewichteteElemente(k, rng, [mi, ma], 1)[0].text === "mi") treffer++;
    }
    expect(treffer / 2000).toBeLessThan(0.2);
  });
});
```

- [ ] **Step 2:** `npx vitest run src/generator/gewichtung.test.ts` → FAIL

- [ ] **Step 3: Implementieren** – `src/generator/gewichtung.ts`

```ts
import { elementWoerter } from "./bausteine";
import { zerlege } from "./grapheme";
import { gewichteteAuswahl, type Rng } from "./rng";
import type { GeneratorKontext, LeseElement } from "./typen";

export const GEWICHT_NEU = 3;
export const GEWICHT_KUERZLICH = 0.1;

export function enthaeltNeuesGraphem(el: LeseElement, k: GeneratorKontext): boolean {
  if (k.neu.size === 0) return false;
  return elementWoerter(el).some((w) =>
    (zerlege(w, k.inhalte.inventar) ?? []).some((g) => k.neu.has(g)),
  );
}

export function gewicht(el: LeseElement, k: GeneratorKontext): number {
  let g = 1;
  if (enthaeltNeuesGraphem(el, k)) g *= GEWICHT_NEU;
  if (k.kuerzlich.has(el.text)) g *= GEWICHT_KUERZLICH;
  return g;
}

export function gewichteteElemente(
  k: GeneratorKontext,
  rng: Rng,
  kandidaten: readonly LeseElement[],
  anzahl: number,
): LeseElement[] {
  return gewichteteAuswahl(rng, kandidaten.map((wert) => ({ wert, gewicht: gewicht(wert, k) })), anzahl);
}
```

- [ ] **Step 4:** `npx vitest run src/generator/gewichtung.test.ts` → PASS

- [ ] **Step 5: Commit** – `git add -A && git commit -m "feat: weight new graphemes up and recent items down"`

---

### Task 7: Aufwärmen und Leseblatt zusammenstellen

**Files:**
- Create: `src/generator/aufwaermen.ts`, `src/generator/leseblatt.ts`
- Test: `src/generator/aufwaermen.test.ts`, `src/generator/leseblatt.test.ts`

**Interfaces:**
- Consumes: Bausteine + `erzeugePseudowoerter` (Task 4), `erzeugeBildsaetze` (Task 5), `gewichteteElemente` (Task 6), `mische` (Task 1), `grossschreiben` (Task 3)
- Produces:
```ts
// aufwaermen.ts
export const AUFWAERM_ANZAHL = 8;
export const MAX_WIEDERHOLUNGEN = 4;
export function erzeugeAufwaermen(k: GeneratorKontext, rng: Rng): LeseElement[];
// leseblatt.ts
export const REIHE_LANG = 8;
export const WORT_REIHE = 6;
export const MAX_WORT_ZEILEN = 3;
export function buchstabenZeilenAnzahl(anzahlBekannt: number): number; // ≤3 → 2, 4–5 → 1, ≥6 → 0
export function erzeugeLeseblatt(k: GeneratorKontext, rng: Rng): Leseblatt;
```

- [ ] **Step 1: Failing tests**

`src/generator/aufwaermen.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { AUFWAERM_ANZAHL, erzeugeAufwaermen } from "./aufwaermen";
import { elementIstLesbar } from "./bausteine";
import { erzeugeRng } from "./rng";
import { testKontext } from "./test-hilfen";

describe("Aufwärmen", () => {
  it("liefert 8 eindeutige, lesbare Elemente ohne Einzelbuchstaben", () => {
    const k = testKontext(["m", "i", "a", "l", "o"]);
    const els = erzeugeAufwaermen(k, erzeugeRng(1));
    expect(els).toHaveLength(AUFWAERM_ANZAHL);
    expect(new Set(els.map((e) => e.text.toLowerCase())).size).toBe(AUFWAERM_ANZAHL);
    for (const el of els) {
      expect(el.typ).not.toBe("buchstabe");
      expect(elementIstLesbar(el, k)).toBe(true);
    }
  });

  it("plant die Wiederholungen bevorzugt ein (4 Plätze)", () => {
    const wiederholungen = ["Mimi", "Mama", "Lama", "Olli", "Mali", "Lio"].map((text) => ({
      typ: "wort" as const, text,
    }));
    const k = testKontext(["m", "i", "a", "l", "o"], { wiederholungen });
    const els = erzeugeAufwaermen(k, erzeugeRng(2));
    const anzahl = els.filter((e) => wiederholungen.some((w) => w.text === e.text)).length;
    expect(anzahl).toBeGreaterThanOrEqual(4);
    expect(els).toHaveLength(8);
  });

  it("lässt unlesbar gewordene Wiederholungen weg (Buchstabe abgewählt)", () => {
    const k = testKontext(["m", "i", "a"], { wiederholungen: [{ typ: "wort", text: "Oma" }] });
    for (let s = 0; s < 50; s++) {
      expect(erzeugeAufwaermen(k, erzeugeRng(s)).map((e) => e.text)).not.toContain("Oma");
    }
  });

  it("kommt mit sehr wenig Material aus", () => {
    const els = erzeugeAufwaermen(testKontext(["m", "a"]), erzeugeRng(3));
    expect(els.length).toBeGreaterThan(0);
    expect(els.length).toBeLessThanOrEqual(8);
    expect(new Set(els.map((e) => e.text.toLowerCase())).size).toBe(els.length);
  });
});
```

Hinweis zum zweiten Test: Die Wiederholungen werden garantiert eingeplant (4 Stück); weitere Treffer sind möglich, weil die gleichen Wörter auch als Pseudowörter entstehen können – daher `>= 4`.

`src/generator/leseblatt.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { elementIstLesbar } from "./bausteine";
import { buchstabenZeilenAnzahl, erzeugeLeseblatt } from "./leseblatt";
import { erzeugeRng } from "./rng";
import { testKontext } from "./test-hilfen";

const arten = (bekannt: string[], seed = 1) =>
  erzeugeLeseblatt(testKontext(bekannt), erzeugeRng(seed)).zeilen.map((z) => z.art);

describe("Leseblatt", () => {
  it("Buchstabenzeilen je nach Stand", () => {
    expect(buchstabenZeilenAnzahl(3)).toBe(2);
    expect(buchstabenZeilenAnzahl(5)).toBe(1);
    expect(buchstabenZeilenAnzahl(6)).toBe(0);
  });

  it("Aufbau mit M, I, A wie das Schulblatt", () => {
    expect(arten(["m", "i", "a"])).toEqual([
      "buchstaben", "buchstaben", "silben", "silben",
      "woerter", "woerter", "woerter",
      "saetze", "saetze", "saetze", "saetze",
    ]);
  });

  it("ohne Buchstabenzeilen ab 6 Graphemen", () => {
    expect(arten(["m", "i", "a", "l", "o", "t"])).not.toContain("buchstaben");
  });

  it("Silbenzeilen: 8 Elemente, nie zweimal dasselbe direkt hintereinander", () => {
    for (let s = 0; s < 30; s++) {
      const blatt = erzeugeLeseblatt(testKontext(["m", "i", "a"]), erzeugeRng(s));
      for (const zeile of blatt.zeilen.filter((z) => z.art === "silben")) {
        expect(zeile.elemente).toHaveLength(8);
        for (let i = 1; i < zeile.elemente.length; i++) {
          expect(zeile.elemente[i].text.toLowerCase()).not.toBe(zeile.elemente[i - 1].text.toLowerCase());
        }
      }
    }
  });

  it("Wörter sind pro Blatt eindeutig und enthalten die echten Wörter", () => {
    const blatt = erzeugeLeseblatt(testKontext(["m", "i", "a"]), erzeugeRng(5));
    const woerter = blatt.zeilen.filter((z) => z.art === "woerter").flatMap((z) => z.elemente);
    expect(new Set(woerter.map((w) => w.text.toLowerCase())).size).toBe(woerter.length);
    expect(woerter.map((w) => w.text)).toEqual(expect.arrayContaining(["Mama", "Mia", "Mimi", "Mami"]));
    for (const z of blatt.zeilen.filter((z) => z.art === "woerter")) expect(z.elemente.length).toBeLessThanOrEqual(6);
  });

  it("Satzzeilen haben Stern und genau einen Satz", () => {
    const blatt = erzeugeLeseblatt(testKontext(["m", "i", "a"]), erzeugeRng(6));
    for (const z of blatt.zeilen.filter((z) => z.art === "saetze")) {
      expect(z.stern).toBe(true);
      expect(z.elemente).toHaveLength(1);
      expect(z.elemente[0].typ).toBe("satz");
    }
  });

  it("alle Elemente sind lesbar", () => {
    const k = testKontext(["m", "i", "a", "l", "o", "t", "n"]);
    for (let s = 0; s < 30; s++) {
      for (const z of erzeugeLeseblatt(k, erzeugeRng(s)).zeilen) {
        for (const el of z.elemente) expect(elementIstLesbar(el, k)).toBe(true);
      }
    }
  });

  it("winzige Buchstabenmenge (m, a) liefert ein kurzes, gültiges Blatt", () => {
    const blatt = erzeugeLeseblatt(testKontext(["m", "a"]), erzeugeRng(7));
    expect(blatt.zeilen.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2:** `npx vitest run src/generator/aufwaermen.test.ts src/generator/leseblatt.test.ts` → FAIL

- [ ] **Step 3: Implementieren**

`src/generator/aufwaermen.ts`:
```ts
import { elementIstLesbar, geschlosseneSilben, offeneSilben, woerterAlsElemente } from "./bausteine";
import { gewichteteElemente } from "./gewichtung";
import { erzeugePseudowoerter } from "./pseudowoerter";
import { mische, type Rng } from "./rng";
import type { GeneratorKontext, LeseElement } from "./typen";

export const AUFWAERM_ANZAHL = 8;
export const MAX_WIEDERHOLUNGEN = 4;

export function erzeugeAufwaermen(k: GeneratorKontext, rng: Rng): LeseElement[] {
  const wiederholt = mische(
    rng,
    k.wiederholungen
      .filter((w) => w.typ !== "satz" && w.typ !== "buchstabe")
      .map((w): LeseElement => ({ typ: w.typ, text: w.text }))
      .filter((el) => elementIstLesbar(el, k)),
  ).slice(0, MAX_WIEDERHOLUNGEN);

  const vergeben = new Set(wiederholt.map((e) => e.text.toLowerCase()));
  const kandidaten = new Map<string, LeseElement>();
  for (const el of [
    ...offeneSilben(k),
    ...geschlosseneSilben(k),
    ...woerterAlsElemente(k),
    ...erzeugePseudowoerter(k, rng, 20),
  ]) {
    const schluessel = el.text.toLowerCase();
    if (!vergeben.has(schluessel) && !kandidaten.has(schluessel)) kandidaten.set(schluessel, el);
  }

  const rest = gewichteteElemente(k, rng, [...kandidaten.values()], AUFWAERM_ANZAHL - wiederholt.length);
  return mische(rng, [...wiederholt, ...rest]);
}
```

`src/generator/leseblatt.ts`:
```ts
import {
  buchstabenElemente, geschlosseneSilben, offeneSilben, woerterAlsElemente,
} from "./bausteine";
import { erzeugeBildsaetze } from "./bildsaetze";
import { gewichteteElemente } from "./gewichtung";
import { grossschreiben } from "./grapheme";
import { erzeugePseudowoerter } from "./pseudowoerter";
import { mische, type Rng } from "./rng";
import type { GeneratorKontext, LeseElement, Leseblatt, Zeile } from "./typen";

export const REIHE_LANG = 8;
export const WORT_REIHE = 6;
export const MAX_WORT_ZEILEN = 3;
const GROSS_ANTEIL = 0.2;

export function buchstabenZeilenAnzahl(anzahlBekannt: number): number {
  if (anzahlBekannt <= 3) return 2;
  if (anzahlBekannt <= 5) return 1;
  return 0;
}

/** Zufällige Reihe mit Wiederholungen, aber nie zweimal dasselbe direkt hintereinander. */
function zufallsReihe(k: GeneratorKontext, rng: Rng, pool: readonly LeseElement[], laenge: number): LeseElement[] {
  const reihe: LeseElement[] = [];
  for (let i = 0; i < laenge; i++) {
    const vorher = reihe.at(-1)?.text;
    const kandidaten = pool.length > 1 ? pool.filter((e) => e.text !== vorher) : pool;
    reihe.push(gewichteteElemente(k, rng, kandidaten, 1)[0]);
  }
  return reihe;
}

function variiereGross(rng: Rng, el: LeseElement): LeseElement {
  return rng.next() < GROSS_ANTEIL ? { ...el, text: grossschreiben(el.text) } : el;
}

export function erzeugeLeseblatt(k: GeneratorKontext, rng: Rng): Leseblatt {
  const zeilen: Zeile[] = [];

  const buchstaben = buchstabenElemente(k);
  if (buchstaben.length > 0) {
    for (let i = 0; i < buchstabenZeilenAnzahl(k.bekannt.size); i++) {
      zeilen.push({ art: "buchstaben", stern: false, elemente: zufallsReihe(k, rng, buchstaben, REIHE_LANG) });
    }
  }

  const silben = [...offeneSilben(k), ...geschlosseneSilben(k)];
  if (silben.length >= 2) {
    for (let i = 0; i < 2; i++) {
      const reihe = zufallsReihe(k, rng, silben, REIHE_LANG).map((el) => variiereGross(rng, el));
      zeilen.push({ art: "silben", stern: false, elemente: reihe });
    }
  }

  const maxWoerter = MAX_WORT_ZEILEN * WORT_REIHE;
  const echte = gewichteteElemente(k, rng, woerterAlsElemente(k), maxWoerter / 2);
  const echteTexte = new Set(echte.map((e) => e.text.toLowerCase()));
  const pseudo = erzeugePseudowoerter(k, rng, maxWoerter)
    .filter((e) => !echteTexte.has(e.text.toLowerCase()))
    .slice(0, maxWoerter - echte.length);
  const woerter = mische(rng, [...echte, ...pseudo]);
  let wortZeilen = 0;
  for (let i = 0; i < woerter.length; i += WORT_REIHE) {
    zeilen.push({ art: "woerter", stern: false, elemente: woerter.slice(i, i + WORT_REIHE) });
    wortZeilen++;
  }

  const satzAnzahl = wortZeilen === MAX_WORT_ZEILEN ? 4 : 5;
  for (const satz of erzeugeBildsaetze(k, rng, satzAnzahl)) {
    zeilen.push({ art: "saetze", stern: true, elemente: [satz] });
  }

  return { zeilen };
}
```

- [ ] **Step 4:** `npx vitest run src/generator` → PASS. Wenn „Aufbau mit M, I, A“ nur 2 Wortzeilen liefert: Mit M, I, A gibt es 6 echte Wörter, deshalb müssen mindestens 12 Pseudowörter entstehen. Prüfen, ob `erzeugePseudowoerter` genug eindeutige Ergebnisse liefert (KV-KVK ergibt bei 2 Konsonantenpositionen und 2 Vokalpositionen 1·2·1·2·1 = 4 Varianten pro Muster, zusammen mehr als 12). Falls der Pool zu klein ist, den Test **nicht** anpassen, sondern melden.

- [ ] **Step 5: Commit** – `git add -A && git commit -m "feat: compose warm-up and reading sheet"`

---

### Task 8: Bonusspiel-Material, `generiere()` und Kernregel-Eigenschaftstest

**Files:**
- Create: `src/generator/bonus.ts`, `src/generator/index.ts`
- Test: `src/generator/bonus.test.ts`, `src/generator/index.test.ts`

**Interfaces:**
- Consumes: alles aus Task 1–7
- Produces:
```ts
// bonus.ts
export const BONUS_RUNDEN = 6;
export const BONUS_MIN_WOERTER = 4;
export function abbildbareWoerter(k: GeneratorKontext): WortEintrag[];
export function erzeugeBonus(k: GeneratorKontext, rng: Rng): BonusRunde[] | null;
// index.ts (öffentliche Generator-API)
export type BuchstabenStand = { ok: true } | { ok: false; fehlt: "vokal" | "konsonant" };
export function pruefeBuchstabenStand(k: GeneratorKontext): BuchstabenStand;
export function generiere(k: GeneratorKontext, seed: number): Tagesmaterial;
export function zaehleWoerterMitGraphem(k: GeneratorKontext, graphem: string): number;
export { erzeugeLeseblatt } from "./leseblatt";
export { erzeugeRng } from "./rng";
export type * from "./typen";
```

- [ ] **Step 1: Failing tests**

`src/generator/bonus.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { inhalte } from "../content";
import { BONUS_RUNDEN, erzeugeBonus } from "./bonus";
import { erzeugeRng } from "./rng";
import { testKontext } from "./test-hilfen";

const mitBildwoertern = {
  ...inhalte,
  woerter: [
    ...inhalte.woerter,
    { text: "Oma", typ: "name" as const, emoji: "👵", kategorie: "Familie" },
    { text: "Lama", typ: "wort" as const, emoji: "🦙", kategorie: "Tiere" },
    { text: "Mais", typ: "wort" as const, emoji: "🌽", kategorie: "Essen" },
  ],
};

describe("Bonusspiel", () => {
  it("ist gesperrt mit weniger als 4 abbildbaren Wörtern", () => {
    expect(erzeugeBonus(testKontext(["m", "i", "a"]), erzeugeRng(1))).toBeNull();
  });

  it("liefert 6 Runden mit je 3 Bildern und genau einer richtigen Antwort", () => {
    const k = testKontext(["m", "a", "o", "l", "i", "s"], { inhalte: mitBildwoertern });
    const runden = erzeugeBonus(k, erzeugeRng(2))!;
    expect(runden).toHaveLength(BONUS_RUNDEN);
    for (const runde of runden) {
      expect(runde.optionen).toHaveLength(3);
      expect(new Set(runde.optionen.map((o) => o.emoji)).size).toBe(3);
      const richtig = runde.optionen.filter((o) => o.richtig);
      expect(richtig).toHaveLength(1);
      const eintrag = mitBildwoertern.woerter.find((w) => w.text === runde.wort)!;
      expect(richtig[0].emoji).toBe(eintrag.emoji);
    }
  });

  it("wählt Ablenker aus anderen Kategorien", () => {
    const k = testKontext(["m", "a", "o", "l", "i", "s"], { inhalte: mitBildwoertern });
    const kategorie = new Map<string, string>([
      ...mitBildwoertern.bilder.map((b) => [b.emoji, b.kategorie] as [string, string]),
      ...mitBildwoertern.woerter.filter((w) => w.emoji).map((w) => [w.emoji!, w.kategorie!] as [string, string]),
    ]);
    for (const runde of erzeugeBonus(k, erzeugeRng(3))!) {
      const ziel = runde.optionen.find((o) => o.richtig)!;
      for (const o of runde.optionen.filter((o) => !o.richtig)) {
        expect(kategorie.get(o.emoji)).not.toBe(kategorie.get(ziel.emoji));
      }
    }
  });
});
```

`src/generator/index.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { inhalte } from "../content";
import { elementIstLesbar } from "./bausteine";
import { generiere, pruefeBuchstabenStand, zaehleWoerterMitGraphem } from "./index";
import { erzeugeRng, mische } from "./rng";
import { testKontext } from "./test-hilfen";

describe("generiere", () => {
  it("ist bei gleichem Seed reproduzierbar", () => {
    const k = testKontext(["m", "i", "a", "l", "o"]);
    expect(generiere(k, 99)).toEqual(generiere(k, 99));
  });

  it("Kernregel: kein Element enthält ein unbekanntes Graphem", () => {
    const alle = inhalte.inventar.map((i) => i.g);
    let geprueft = 0;
    for (let seed = 0; seed < 300; seed++) {
      const rng = erzeugeRng(seed * 7919);
      const anzahl = 2 + Math.floor(rng.next() * 19);
      const k = testKontext(mische(rng, alle).slice(0, anzahl));
      if (!pruefeBuchstabenStand(k).ok) continue;
      geprueft++;
      const material = generiere(k, seed);
      const elemente = [
        ...material.aufwaermen,
        ...material.leseblatt.zeilen.flatMap((z) => z.elemente),
        ...(material.bonus ?? []).map((r) => ({ typ: "wort" as const, text: r.wort })),
      ];
      for (const el of elemente) {
        if (!elementIstLesbar(el, k)) {
          throw new Error(`Unlesbar: "${el.text}" bei ${[...k.bekannt].join(",")}`);
        }
      }
    }
    expect(geprueft).toBeGreaterThan(150);
  });
});

describe("pruefeBuchstabenStand", () => {
  it("meldet fehlenden Vokal oder Konsonanten", () => {
    expect(pruefeBuchstabenStand(testKontext([]))).toEqual({ ok: false, fehlt: "vokal" });
    expect(pruefeBuchstabenStand(testKontext(["m"]))).toEqual({ ok: false, fehlt: "vokal" });
    expect(pruefeBuchstabenStand(testKontext(["a"]))).toEqual({ ok: false, fehlt: "konsonant" });
    expect(pruefeBuchstabenStand(testKontext(["m", "a"]))).toEqual({ ok: true });
  });
});

describe("zaehleWoerterMitGraphem", () => {
  it("zählt lesbare Wörter, die das Graphem enthalten", () => {
    const k = testKontext(["m", "i", "a"]);
    expect(zaehleWoerterMitGraphem(k, "i")).toBe(4); // Mami, Mia, Mimi, im
    expect(zaehleWoerterMitGraphem(k, "a")).toBe(4); // am, Mama, Mami, Mia
    expect(zaehleWoerterMitGraphem(k, "o")).toBe(0);
  });
});
```

- [ ] **Step 2:** `npx vitest run src/generator` → FAIL

- [ ] **Step 3: Implementieren**

`src/generator/bonus.ts`:
```ts
import type { WortEintrag } from "../content/typen";
import { lesbareWoerter } from "./bausteine";
import { mische, type Rng } from "./rng";
import type { BonusRunde, GeneratorKontext } from "./typen";

export const BONUS_RUNDEN = 6;
export const BONUS_MIN_WOERTER = 4;

export function abbildbareWoerter(k: GeneratorKontext): WortEintrag[] {
  return lesbareWoerter(k).filter((w) => w.emoji && w.kategorie);
}

export function erzeugeBonus(k: GeneratorKontext, rng: Rng): BonusRunde[] | null {
  const ziele = abbildbareWoerter(k);
  if (ziele.length < BONUS_MIN_WOERTER) return null;

  const bildpool = new Map<string, { emoji: string; kategorie: string }>();
  for (const w of k.inhalte.woerter) {
    if (w.emoji && w.kategorie) bildpool.set(w.emoji, { emoji: w.emoji, kategorie: w.kategorie });
  }
  for (const b of k.inhalte.bilder) {
    if (!bildpool.has(b.emoji)) bildpool.set(b.emoji, { emoji: b.emoji, kategorie: b.kategorie });
  }

  const reihenfolge = mische(rng, ziele);
  const runden: BonusRunde[] = [];
  for (let i = 0; i < BONUS_RUNDEN; i++) {
    const ziel = reihenfolge[i % reihenfolge.length];
    const andere = [...bildpool.values()].filter((b) => b.emoji !== ziel.emoji);
    const fremd = andere.filter((b) => b.kategorie !== ziel.kategorie);
    const ablenker = mische(rng, fremd.length >= 2 ? fremd : andere).slice(0, 2);
    runden.push({
      wort: ziel.text,
      optionen: mische(rng, [
        { emoji: ziel.emoji!, richtig: true },
        ...ablenker.map((b) => ({ emoji: b.emoji, richtig: false })),
      ]),
    });
  }
  return runden;
}
```

`src/generator/index.ts`:
```ts
import { erzeugeAufwaermen } from "./aufwaermen";
import { geschlosseneSilben, lesbareWoerter, offeneSilben, silbenVokale } from "./bausteine";
import { erzeugeBonus } from "./bonus";
import { zerlege } from "./grapheme";
import { erzeugeLeseblatt } from "./leseblatt";
import { erzeugeRng } from "./rng";
import type { GeneratorKontext, Tagesmaterial } from "./typen";

export type BuchstabenStand = { ok: true } | { ok: false; fehlt: "vokal" | "konsonant" };

export function pruefeBuchstabenStand(k: GeneratorKontext): BuchstabenStand {
  if (offeneSilben(k).length > 0 || geschlosseneSilben(k).length > 0) return { ok: true };
  return { ok: false, fehlt: silbenVokale(k).length > 0 ? "konsonant" : "vokal" };
}

export function generiere(k: GeneratorKontext, seed: number): Tagesmaterial {
  const rng = erzeugeRng(seed);
  return {
    aufwaermen: erzeugeAufwaermen(k, rng),
    leseblatt: erzeugeLeseblatt(k, rng),
    bonus: erzeugeBonus(k, rng),
  };
}

export function zaehleWoerterMitGraphem(k: GeneratorKontext, graphem: string): number {
  return lesbareWoerter(k).filter((w) =>
    (zerlege(w.text, k.inhalte.inventar, w.zerlegung) ?? []).includes(graphem),
  ).length;
}

export { erzeugeLeseblatt } from "./leseblatt";
export { erzeugeRng } from "./rng";
export type * from "./typen";
```

- [ ] **Step 4:** `npm test && npm run typecheck` → PASS. Wenn der Kernregel-Test scheitert, zeigt die Fehlermeldung Text und Buchstabenmenge – Ursache im betroffenen Baustein beheben, nicht den Test lockern.

- [ ] **Step 5: Commit** – `git add -A && git commit -m "feat: add bonus game material and public generator API"`

---

### Task 9: Inhaltsprüfung (`npm run check-content`)

**Files:**
- Create: `src/content/pruefen.ts`, `scripts/check-content.ts`
- Test: `src/content/pruefen.test.ts`

**Interfaces:**
- Consumes: `Inhalte` (Task 2), `zerlege`, `istGesperrt` (Task 3), `istPlatzhalter`, `bildEtikett`, `NAME_PLATZHALTER` (Task 5)
- Produces: `export function pruefeInhalte(inhalte: Inhalte): string[]` – leere Liste = alles in Ordnung; sonst deutsche Fehlermeldungen.

Geprüft wird:
- Inventar: `g` nicht leer, klein, eindeutig; `typ` ist `vokal` oder `konsonant`.
- Wörter: `text` nicht leer; `typ` ist `wort` oder `name`; keine Duplikate (ohne Groß/klein); vollständig zerlegbar (ggf. mit `zerlegung`); `emoji` nur zusammen mit `kategorie`; kein Sperrlisten-Treffer.
- Bilder: `emoji` eindeutig; `wort`, `kategorie` nicht leer; mindestens ein Etikett; jedes Etikett wird von einer Schablone verwendet.
- Schablonen: `id` eindeutig; `teile` nicht leer; jeder Bild-Platzhalter hat mindestens ein Bild; feste Wörter sind zerlegbar.
- Sperrliste: nur klein geschriebene, nicht leere Einträge.

- [ ] **Step 1: Failing test** – `src/content/pruefen.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { inhalte } from "./index";
import { pruefeInhalte } from "./pruefen";
import type { Inhalte } from "./typen";

const mit = (aenderung: Partial<Inhalte>): Inhalte => ({ ...inhalte, ...aenderung });

describe("pruefeInhalte", () => {
  it("die mitgelieferten Inhalte sind gültig", () => {
    expect(pruefeInhalte(inhalte)).toEqual([]);
  });

  it("findet doppelte Wörter", () => {
    const fehler = pruefeInhalte(mit({ woerter: [...inhalte.woerter, { text: "mama", typ: "wort" }] }));
    expect(fehler.join("\n")).toContain("Doppeltes Wort");
  });

  it("findet nicht zerlegbare Wörter", () => {
    const fehler = pruefeInhalte(mit({ woerter: [...inhalte.woerter, { text: "Pizza1", typ: "wort" }] }));
    expect(fehler.join("\n")).toContain("nicht zerlegbar");
  });

  it("findet Emoji ohne Kategorie", () => {
    const fehler = pruefeInhalte(mit({ woerter: [...inhalte.woerter, { text: "Oma", typ: "name", emoji: "👵" }] }));
    expect(fehler.join("\n")).toContain("Kategorie");
  });

  it("findet Sperrlisten-Treffer in der Wortliste", () => {
    const fehler = pruefeInhalte(mit({ woerter: [...inhalte.woerter, { text: "Kacke", typ: "wort" }] }));
    expect(fehler.join("\n")).toContain("Sperrliste");
  });

  it("findet unbekannte Bild-Etiketten", () => {
    const bilder = [...inhalte.bilder, { emoji: "🦄", wort: "Einhorn", kategorie: "Tiere", etiketten: ["Fantasie"] }];
    expect(pruefeInhalte(mit({ bilder })).join("\n")).toContain("Etikett");
  });

  it("findet Platzhalter ohne Bild", () => {
    const schablonen = [...inhalte.schablonen, { id: "x", teile: ["[Name]", "auf", "[Ort-auf]"] }];
    expect(pruefeInhalte(mit({ schablonen })).join("\n")).toContain("kein Bild");
  });

  it("findet doppelte Schablonen-IDs und Emojis", () => {
    const fehler = pruefeInhalte(mit({
      schablonen: [...inhalte.schablonen, inhalte.schablonen[0]],
      bilder: [...inhalte.bilder, inhalte.bilder[0]],
    })).join("\n");
    expect(fehler).toContain("Doppelte Schablone");
    expect(fehler).toContain("Doppeltes Emoji");
  });
});
```

- [ ] **Step 2:** `npx vitest run src/content/pruefen.test.ts` → FAIL

- [ ] **Step 3: Implementieren** – `src/content/pruefen.ts`

```ts
import { bildEtikett, istPlatzhalter, NAME_PLATZHALTER } from "../generator/bildsaetze";
import { istGesperrt, zerlege } from "../generator/grapheme";
import type { Inhalte } from "./typen";

const istText = (x: unknown): x is string => typeof x === "string" && x.trim().length > 0;

export function pruefeInhalte(inhalte: Inhalte): string[] {
  const fehler: string[] = [];

  const gesehenG = new Set<string>();
  for (const info of inhalte.inventar) {
    if (!istText(info.g) || info.g !== info.g.toLowerCase()) fehler.push(`Graphem ungültig: "${info.g}"`);
    if (gesehenG.has(info.g)) fehler.push(`Doppeltes Graphem: "${info.g}"`);
    gesehenG.add(info.g);
    if (info.typ !== "vokal" && info.typ !== "konsonant") fehler.push(`Graphem "${info.g}": Typ ungültig`);
  }

  const gesehenW = new Set<string>();
  for (const w of inhalte.woerter) {
    if (!istText(w.text)) { fehler.push(`Wort ohne Text: ${JSON.stringify(w)}`); continue; }
    if (w.typ !== "wort" && w.typ !== "name") fehler.push(`Wort "${w.text}": Typ muss "wort" oder "name" sein`);
    const schluessel = w.text.toLowerCase();
    if (gesehenW.has(schluessel)) fehler.push(`Doppeltes Wort: "${w.text}"`);
    gesehenW.add(schluessel);
    if (!zerlege(w.text, inhalte.inventar, w.zerlegung)) fehler.push(`Wort "${w.text}" ist nicht zerlegbar`);
    if (w.emoji !== undefined && !istText(w.kategorie)) fehler.push(`Wort "${w.text}": Emoji ohne Kategorie`);
    if (istGesperrt(w.text, inhalte.sperrliste)) fehler.push(`Wort "${w.text}" trifft die Sperrliste`);
  }

  const genutzteEtiketten = new Set(
    inhalte.schablonen.flatMap((s) => s.teile.map(bildEtikett).filter((e): e is string => e !== null)),
  );
  const gesehenE = new Set<string>();
  for (const b of inhalte.bilder) {
    if (gesehenE.has(b.emoji)) fehler.push(`Doppeltes Emoji: ${b.emoji}`);
    gesehenE.add(b.emoji);
    if (!istText(b.wort) || !istText(b.kategorie)) fehler.push(`Bild ${b.emoji}: Wort oder Kategorie fehlt`);
    if (!Array.isArray(b.etiketten) || b.etiketten.length === 0) fehler.push(`Bild ${b.emoji}: keine Etiketten`);
    for (const e of b.etiketten ?? []) {
      if (!genutzteEtiketten.has(e)) fehler.push(`Bild ${b.emoji}: Etikett "${e}" wird von keiner Schablone verwendet`);
    }
  }

  const gesehenS = new Set<string>();
  for (const s of inhalte.schablonen) {
    if (gesehenS.has(s.id)) fehler.push(`Doppelte Schablone: "${s.id}"`);
    gesehenS.add(s.id);
    if (!Array.isArray(s.teile) || s.teile.length === 0) { fehler.push(`Schablone "${s.id}" ist leer`); continue; }
    for (const teil of s.teile) {
      if (teil === NAME_PLATZHALTER) continue;
      const etikett = bildEtikett(teil);
      if (etikett !== null) {
        if (!inhalte.bilder.some((b) => b.etiketten.includes(etikett))) {
          fehler.push(`Schablone "${s.id}": für "${teil}" gibt es kein Bild`);
        }
      } else if (istPlatzhalter(teil) || !zerlege(teil, inhalte.inventar)) {
        fehler.push(`Schablone "${s.id}": "${teil}" ist nicht zerlegbar`);
      }
    }
  }

  for (const s of inhalte.sperrliste) {
    if (!istText(s) || s !== s.toLowerCase()) fehler.push(`Sperrliste: ungültiger Eintrag "${s}"`);
  }

  return fehler;
}
```

`scripts/check-content.ts`:
```ts
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
```

- [ ] **Step 4:** `npx vitest run src/content && npm run check-content` → Tests PASS, Skript gibt `✅ Inhalte ok: 6 Wörter, 30 Bilder, 4 Schablonen, 43 Grapheme.` aus.

- [ ] **Step 5: Commit** – `git add -A && git commit -m "feat: add content validation script"`

---

### Task 10: Datentypen und Zeiterfassung

**Files:**
- Create: `src/progress/typen.ts`, `src/progress/zeit.ts`
- Test: `src/progress/zeit.test.ts`

**Interfaces:**
- Consumes: `ElementTyp` (Task 4)
- Produces:
```ts
// typen.ts
export interface Freischaltung { graphem: string; datum: string }            // ISO
export interface Wiederholung { text: string; typ: ElementTyp; richtigInFolge: number }
export interface Sitzung {
  id: string; start: string; ende: string;
  aktiveSekunden: number; richtig: number; fehlversuche: number;
  gezeigteElemente: string[];
}
export interface Spielstand { sterne: number; stickerAlben: string[][]; letzterStickerTag: string | null; offeneFeier: string[] }
export interface Einstellungen { tageszielMinuten: number }
export interface AppDaten {
  schemaVersion: 1;
  angelegtAm: string;
  freischaltungen: Freischaltung[];
  sitzungen: Sitzung[];
  wiederholungen: Wiederholung[];
  spielstand: Spielstand;
  einstellungen: Einstellungen;
  letzteSicherung: string | null;
}
export const STANDARD_TAGESZIEL_MINUTEN = 10;
export function leereDaten(jetzt: Date): AppDaten;
// zeit.ts
export const LEERLAUF_EINZEL_MS = 60_000;
export const LEERLAUF_BLATT_MS = 300_000;
export interface Zeitmesser { aktivMs: number; letzterZeitpunkt: number; letzteEingabe: number; manuellPausiert: boolean; leerlaufMs: number }
export function starteZeitmesser(jetzt: number, leerlaufMs: number): Zeitmesser;
export function tick(z: Zeitmesser, jetzt: number): Zeitmesser;
export function eingabe(z: Zeitmesser, jetzt: number): Zeitmesser;      // setzt auch manuelle Pause zurück
export function pausiere(z: Zeitmesser, jetzt: number): Zeitmesser;
export function setzeLeerlauf(z: Zeitmesser, jetzt: number, leerlaufMs: number): Zeitmesser; // zählt als Eingabe
export function istPausiert(z: Zeitmesser, jetzt: number): boolean;
```

Abweichungen von der Skizze in Spec §7.2 (bewusst): `Sitzung.id` (für laufendes Speichern), `Spielstand.letzterStickerTag` (max. 1 Sticker/Tag), `AppDaten.angelegtAm` (Sicherungs-Erinnerung ohne vorherige Sicherung).

- [ ] **Step 1: Typen anlegen** – `src/progress/typen.ts` mit den Typen oben und:

```ts
export const STANDARD_TAGESZIEL_MINUTEN = 10;

export function leereDaten(jetzt: Date): AppDaten {
  return {
    schemaVersion: 1,
    angelegtAm: jetzt.toISOString(),
    freischaltungen: [],
    sitzungen: [],
    wiederholungen: [],
    spielstand: { sterne: 0, stickerAlben: [], letzterStickerTag: null, offeneFeier: [] },
    einstellungen: { tageszielMinuten: STANDARD_TAGESZIEL_MINUTEN },
    letzteSicherung: null,
  };
}
```

- [ ] **Step 2: Failing test** – `src/progress/zeit.test.ts`

```ts
import { describe, expect, it } from "vitest";
import {
  eingabe, istPausiert, LEERLAUF_BLATT_MS, LEERLAUF_EINZEL_MS, pausiere, setzeLeerlauf, starteZeitmesser, tick,
} from "./zeit";

const s = (sekunden: number) => sekunden * 1000;

describe("Zeitmesser", () => {
  it("zählt Zeit zwischen Ticks", () => {
    const z = tick(starteZeitmesser(0, LEERLAUF_EINZEL_MS), s(30));
    expect(z.aktivMs).toBe(s(30));
  });

  it("pausiert nach 60 s ohne Eingabe (die 60 s zählen noch)", () => {
    let z = starteZeitmesser(0, LEERLAUF_EINZEL_MS);
    z = tick(z, s(200));
    expect(z.aktivMs).toBe(s(60));
    expect(istPausiert(z, s(200))).toBe(true);
  });

  it("läuft nach einer Eingabe weiter", () => {
    let z = starteZeitmesser(0, LEERLAUF_EINZEL_MS);
    z = tick(z, s(200));
    z = eingabe(z, s(200));
    expect(istPausiert(z, s(200))).toBe(false);
    z = tick(z, s(210));
    expect(z.aktivMs).toBe(s(70));
  });

  it("im Leseblatt gilt 5 Minuten Leerlauf", () => {
    let z = starteZeitmesser(0, LEERLAUF_EINZEL_MS);
    z = setzeLeerlauf(z, 0, LEERLAUF_BLATT_MS);
    z = tick(z, s(240));
    expect(z.aktivMs).toBe(s(240));
    z = tick(z, s(400));
    expect(z.aktivMs).toBe(s(300));
  });

  it("Pause-Knopf stoppt sofort, Eingabe hebt ihn auf", () => {
    let z = starteZeitmesser(0, LEERLAUF_EINZEL_MS);
    z = tick(z, s(10));
    z = pausiere(z, s(10));
    z = tick(z, s(40));
    expect(z.aktivMs).toBe(s(10));
    expect(istPausiert(z, s(40))).toBe(true);
    z = eingabe(z, s(40));
    z = tick(z, s(45));
    expect(z.aktivMs).toBe(s(15));
  });

  it("zählt nichts doppelt bei mehreren Ticks", () => {
    let z = starteZeitmesser(0, LEERLAUF_EINZEL_MS);
    for (let t = 1; t <= 30; t++) z = tick(z, s(t));
    expect(z.aktivMs).toBe(s(30));
  });
});
```

- [ ] **Step 3:** `npx vitest run src/progress/zeit.test.ts` → FAIL

- [ ] **Step 4: Implementieren** – `src/progress/zeit.ts`

```ts
export const LEERLAUF_EINZEL_MS = 60_000;
export const LEERLAUF_BLATT_MS = 300_000;

export interface Zeitmesser {
  aktivMs: number;
  letzterZeitpunkt: number;
  letzteEingabe: number;
  manuellPausiert: boolean;
  leerlaufMs: number;
}

export function starteZeitmesser(jetzt: number, leerlaufMs: number): Zeitmesser {
  return { aktivMs: 0, letzterZeitpunkt: jetzt, letzteEingabe: jetzt, manuellPausiert: false, leerlaufMs };
}

export function tick(z: Zeitmesser, jetzt: number): Zeitmesser {
  if (z.manuellPausiert) return { ...z, letzterZeitpunkt: jetzt };
  const ende = Math.min(jetzt, z.letzteEingabe + z.leerlaufMs);
  const zuwachs = Math.max(0, ende - z.letzterZeitpunkt);
  return { ...z, aktivMs: z.aktivMs + zuwachs, letzterZeitpunkt: jetzt };
}

export function eingabe(z: Zeitmesser, jetzt: number): Zeitmesser {
  return { ...tick(z, jetzt), letzteEingabe: jetzt, manuellPausiert: false };
}

export function pausiere(z: Zeitmesser, jetzt: number): Zeitmesser {
  return { ...tick(z, jetzt), manuellPausiert: true };
}

export function setzeLeerlauf(z: Zeitmesser, jetzt: number, leerlaufMs: number): Zeitmesser {
  return { ...eingabe(z, jetzt), leerlaufMs };
}

export function istPausiert(z: Zeitmesser, jetzt: number): boolean {
  return z.manuellPausiert || jetzt - z.letzteEingabe > z.leerlaufMs;
}
```

- [ ] **Step 5:** `npx vitest run src/progress` → PASS

- [ ] **Step 6: Commit** – `git add -A && git commit -m "feat: add app data types and active reading timer"`

---

### Task 11: Tagesauswertung und laufendes Speichern der Sitzung

**Files:**
- Create: `src/progress/auswertung.ts`, `src/progress/sitzung.ts`
- Test: `src/progress/auswertung.test.ts`, `src/progress/sitzung.test.ts`

**Interfaces:**
- Consumes: `Sitzung`, `AppDaten`, `leereDaten` (Task 10)
- Produces:
```ts
// auswertung.ts
export function tagSchluessel(d: Date): string;                 // lokales Datum "YYYY-MM-DD"
export interface Tageswerte { tag: string; aktiveSekunden: number; richtig: number; fehlversuche: number }
export interface ProtokollZeile extends Tageswerte { zielErreicht: boolean }
export function tageswerte(sitzungen: readonly Sitzung[], tag: string): Tageswerte;  // Sitzung zählt zum Tag ihres Starts
export function zielErreicht(w: Tageswerte, minuten: number): boolean;
export function protokoll(sitzungen: readonly Sitzung[], minuten: number): ProtokollZeile[]; // neueste zuerst
export function wochentage(heute: Date): string[];             // Mo..So der Woche von `heute`
export function wochenUebersicht(sitzungen: readonly Sitzung[], heute: Date, minuten: number): ProtokollZeile[];
export function wochenSmileys(sitzungen: readonly Sitzung[], heute: Date, minuten: number): boolean[];
export function leseKette(sitzungen: readonly Sitzung[], heute: Date, minuten: number): number;
// sitzung.ts
export function neueSitzung(id: string, jetzt: Date): Sitzung;
export function upsertSitzung(daten: AppDaten, sitzung: Sitzung): AppDaten;
```

- [ ] **Step 1: Failing tests**

`src/progress/auswertung.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import {
  leseKette, protokoll, tageswerte, tagSchluessel, wochenSmileys, wochentage, wochenUebersicht, zielErreicht,
} from "./auswertung";
import type { Sitzung } from "./typen";

// 2026-10-08 ist ein Donnerstag. Lokale Zeiten → zeitzonenunabhängig.
const am = (tag: number, stunde = 10) => new Date(2026, 9, tag, stunde, 0, 0);
const sitzung = (tag: number, minuten: number, richtig = 10, stunde = 10): Sitzung => ({
  id: `${tag}-${stunde}`,
  start: am(tag, stunde).toISOString(),
  ende: am(tag, stunde).toISOString(),
  aktiveSekunden: minuten * 60,
  richtig,
  fehlversuche: 1,
  gezeigteElemente: [],
});

describe("Auswertung", () => {
  it("tagSchluessel nutzt das lokale Datum", () => {
    expect(tagSchluessel(am(8))).toBe("2026-10-08");
    expect(tagSchluessel(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("summiert mehrere Sitzungen eines Tages", () => {
    const w = tageswerte([sitzung(8, 4, 10, 9), sitzung(8, 7, 20, 17), sitzung(7, 30)], "2026-10-08");
    expect(w).toEqual({ tag: "2026-10-08", aktiveSekunden: 660, richtig: 30, fehlversuche: 2 });
    expect(zielErreicht(w, 10)).toBe(true);
    expect(zielErreicht(w, 12)).toBe(false);
  });

  it("Protokoll: ein Eintrag pro Tag, neueste zuerst", () => {
    const p = protokoll([sitzung(6, 12), sitzung(8, 3), sitzung(8, 3, 5, 15)], 10);
    expect(p.map((z) => [z.tag, z.zielErreicht])).toEqual([["2026-10-08", false], ["2026-10-06", true]]);
  });

  it("Wochentage Mo–So", () => {
    expect(wochentage(am(8))).toEqual([
      "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11",
    ]);
    expect(wochentage(new Date(2026, 9, 11))[0]).toBe("2026-10-05"); // Sonntag gehört zur selben Woche
  });

  it("Wochen-Smileys und -Übersicht", () => {
    const s = [sitzung(5, 10), sitzung(7, 15), sitzung(8, 5)];
    expect(wochenSmileys(s, am(8), 10)).toEqual([true, false, true, false, false, false, false]);
    expect(wochenUebersicht(s, am(8), 10)[2]).toMatchObject({ tag: "2026-10-07", aktiveSekunden: 900, zielErreicht: true });
  });

  it("Lese-Kette zählt zurück ab heute bzw. gestern", () => {
    const s = [sitzung(4, 10), sitzung(6, 10), sitzung(7, 10)];
    expect(leseKette(s, am(8), 10)).toBe(2);                       // heute noch offen → ab gestern
    expect(leseKette([...s, sitzung(8, 10)], am(8), 10)).toBe(3);  // heute erreicht
    expect(leseKette([sitzung(5, 10)], am(8), 10)).toBe(0);        // Kette gerissen
  });
});
```

`src/progress/sitzung.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { neueSitzung, upsertSitzung } from "./sitzung";
import { leereDaten } from "./typen";

describe("Sitzung speichern", () => {
  it("fügt neu ein und ersetzt bei gleicher id", () => {
    const jetzt = new Date(2026, 9, 8, 10);
    let daten = leereDaten(jetzt);
    const s = neueSitzung("a", jetzt);
    daten = upsertSitzung(daten, s);
    expect(daten.sitzungen).toHaveLength(1);
    daten = upsertSitzung(daten, { ...s, aktiveSekunden: 42 });
    expect(daten.sitzungen).toHaveLength(1);
    expect(daten.sitzungen[0].aktiveSekunden).toBe(42);
    daten = upsertSitzung(daten, neueSitzung("b", jetzt));
    expect(daten.sitzungen.map((x) => x.id)).toEqual(["a", "b"]);
  });

  it("neue Sitzung startet bei null", () => {
    expect(neueSitzung("x", new Date(0))).toMatchObject({
      id: "x", aktiveSekunden: 0, richtig: 0, fehlversuche: 0, gezeigteElemente: [],
    });
  });
});
```

- [ ] **Step 2:** `npx vitest run src/progress` → FAIL

- [ ] **Step 3: Implementieren**

`src/progress/auswertung.ts`:
```ts
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
```

`src/progress/sitzung.ts`:
```ts
import type { AppDaten, Sitzung } from "./typen";

export function neueSitzung(id: string, jetzt: Date): Sitzung {
  const iso = jetzt.toISOString();
  return { id, start: iso, ende: iso, aktiveSekunden: 0, richtig: 0, fehlversuche: 0, gezeigteElemente: [] };
}

export function upsertSitzung(daten: AppDaten, sitzung: Sitzung): AppDaten {
  const vorhanden = daten.sitzungen.some((s) => s.id === sitzung.id);
  return {
    ...daten,
    sitzungen: vorhanden
      ? daten.sitzungen.map((s) => (s.id === sitzung.id ? sitzung : s))
      : [...daten.sitzungen, sitzung],
  };
}
```

- [ ] **Step 4:** `npx vitest run src/progress` → PASS

- [ ] **Step 5: Commit** – `git add -A && git commit -m "feat: add daily evaluation, streak and session upsert"`

---

### Task 12: Speicherung, Migration, Export/Import

**Files:**
- Create: `src/storage/storage.ts`
- Test: `src/storage/storage.test.ts`

**Interfaces:**
- Consumes: `AppDaten`, `leereDaten` (Task 10)
- Produces:
```ts
export const SPEICHER_SCHLUESSEL = "lesestart-daten";
export const DEFEKT_PRAEFIX = "lesestart-daten-defekt-";
export const SICHERUNG_NACH_TAGEN = 14;
export interface Speicher { getItem(k: string): string | null; setItem(k: string, v: string): void }
export interface LadeErgebnis { daten: AppDaten; fehler: string | null }
export function holeSpeicher(): Speicher | null;
export function pruefeDaten(roh: unknown): AppDaten | null;           // validiert + migriert
export function ladeDaten(speicher: Speicher | null, jetzt: Date): LadeErgebnis;
export function speichereDaten(speicher: Speicher | null, daten: AppDaten): boolean;
export function exportiere(daten: AppDaten, jetzt: Date): { json: string; daten: AppDaten; dateiname: string };
export function importiere(text: string): { ok: true; daten: AppDaten } | { ok: false; fehler: string };
export function sicherungFaellig(daten: AppDaten, jetzt: Date): boolean;
```

Migration: Es gibt nur Version 1. `pruefeDaten` akzeptiert `schemaVersion === 1` und lehnt alles andere ab. Eine künftige Version 2 ergänzt hier einen Schritt `v1 → v2`.

- [ ] **Step 1: Failing test** – `src/storage/storage.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { leereDaten } from "../progress/typen";
import {
  DEFEKT_PRAEFIX, exportiere, importiere, ladeDaten, pruefeDaten, sicherungFaellig, SPEICHER_SCHLUESSEL,
  speichereDaten, type Speicher,
} from "./storage";

class TestSpeicher implements Speicher {
  daten = new Map<string, string>();
  getItem(k: string) { return this.daten.get(k) ?? null; }
  setItem(k: string, v: string) { this.daten.set(k, v); }
}
class VollerSpeicher extends TestSpeicher {
  setItem() { throw new Error("QuotaExceededError"); }
}

const jetzt = new Date(2026, 9, 8, 10);
const beispiel = () => ({
  ...leereDaten(jetzt),
  freischaltungen: [{ graphem: "m", datum: jetzt.toISOString() }],
  sitzungen: [{ id: "a", start: jetzt.toISOString(), ende: jetzt.toISOString(), aktiveSekunden: 60, richtig: 3, fehlversuche: 1, gezeigteElemente: ["mi"] }],
});

describe("Speicherung", () => {
  it("speichert und lädt identisch", () => {
    const sp = new TestSpeicher();
    expect(speichereDaten(sp, beispiel())).toBe(true);
    expect(ladeDaten(sp, jetzt)).toEqual({ daten: beispiel(), fehler: null });
  });

  it("liefert leere Daten, wenn nichts gespeichert ist", () => {
    expect(ladeDaten(new TestSpeicher(), jetzt)).toEqual({ daten: leereDaten(jetzt), fehler: null });
  });

  it("meldet fehlenden Speicher", () => {
    const e = ladeDaten(null, jetzt);
    expect(e.fehler).toMatch(/nicht verfügbar/);
    expect(speichereDaten(null, e.daten)).toBe(false);
  });

  it("meldet volle Speicher beim Schreiben", () => {
    expect(speichereDaten(new VollerSpeicher(), beispiel())).toBe(false);
  });

  it("sichert kaputte Rohdaten, bevor neu begonnen wird", () => {
    const sp = new TestSpeicher();
    sp.setItem(SPEICHER_SCHLUESSEL, "{kaputt");
    const e = ladeDaten(sp, jetzt);
    expect(e.fehler).toMatch(/unlesbar/);
    expect(e.daten).toEqual(leereDaten(jetzt));
    const sicherung = [...sp.daten.entries()].find(([k]) => k.startsWith(DEFEKT_PRAEFIX));
    expect(sicherung?.[1]).toBe("{kaputt");
  });

  it("pruefeDaten lehnt fremde Strukturen und unbekannte Versionen ab", () => {
    expect(pruefeDaten({ foo: 1 })).toBeNull();
    expect(pruefeDaten({ ...beispiel(), schemaVersion: 2 })).toBeNull();
    expect(pruefeDaten({ ...beispiel(), sitzungen: [{ id: 1 }] })).toBeNull();
    expect(pruefeDaten(beispiel())).toEqual(beispiel());
  });

  it("Export → Import ergibt identische Daten und setzt letzteSicherung", () => {
    const { json, daten, dateiname } = exportiere(beispiel(), jetzt);
    expect(daten.letzteSicherung).toBe(jetzt.toISOString());
    expect(dateiname).toBe("lesestart-sicherung-2026-10-08.json");
    expect(importiere(json)).toEqual({ ok: true, daten });
  });

  it("ungültiger Import liefert Fehler", () => {
    expect(importiere("kein json").ok).toBe(false);
    expect(importiere(JSON.stringify({ hallo: "welt" })).ok).toBe(false);
  });

  it("Sicherung nach 14 Tagen fällig", () => {
    const d = leereDaten(new Date(2026, 8, 20));
    expect(sicherungFaellig(d, new Date(2026, 9, 3))).toBe(false);
    expect(sicherungFaellig(d, new Date(2026, 9, 5))).toBe(true);
    expect(sicherungFaellig({ ...d, letzteSicherung: new Date(2026, 9, 1).toISOString() }, new Date(2026, 9, 8))).toBe(false);
  });
});
```

- [ ] **Step 2:** `npx vitest run src/storage` → FAIL

- [ ] **Step 3: Implementieren** – `src/storage/storage.ts`

```ts
import { tagSchluessel } from "../progress/auswertung";
import { leereDaten, type AppDaten } from "../progress/typen";

export const SPEICHER_SCHLUESSEL = "lesestart-daten";
export const DEFEKT_PRAEFIX = "lesestart-daten-defekt-";
export const SICHERUNG_NACH_TAGEN = 14;

export interface Speicher {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}
export interface LadeErgebnis { daten: AppDaten; fehler: string | null }

export function holeSpeicher(): Speicher | null {
  try {
    const sp = window.localStorage;
    const test = "__lesestart_test__";
    sp.setItem(test, "1");
    sp.removeItem(test);
    return sp;
  } catch {
    return null;
  }
}

const istObjekt = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const istString = (x: unknown): x is string => typeof x === "string";
const istZahl = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const istListe = <T>(x: unknown, pruefe: (e: unknown) => e is T): x is T[] => Array.isArray(x) && x.every(pruefe);

const istFreischaltung = (x: unknown): x is AppDaten["freischaltungen"][number] =>
  istObjekt(x) && istString(x.graphem) && istString(x.datum);
const istWiederholung = (x: unknown): x is AppDaten["wiederholungen"][number] =>
  istObjekt(x) && istString(x.text) && istString(x.typ) && istZahl(x.richtigInFolge);
const istSitzung = (x: unknown): x is AppDaten["sitzungen"][number] =>
  istObjekt(x) && istString(x.id) && istString(x.start) && istString(x.ende) &&
  istZahl(x.aktiveSekunden) && istZahl(x.richtig) && istZahl(x.fehlversuche) &&
  istListe(x.gezeigteElemente, istString);
const istStringListe = (x: unknown): x is string[] => istListe(x, istString);

export function pruefeDaten(roh: unknown): AppDaten | null {
  if (!istObjekt(roh) || roh.schemaVersion !== 1) return null;
  const sp = roh.spielstand;
  const ein = roh.einstellungen;
  const gueltig =
    istString(roh.angelegtAm) &&
    istListe(roh.freischaltungen, istFreischaltung) &&
    istListe(roh.sitzungen, istSitzung) &&
    istListe(roh.wiederholungen, istWiederholung) &&
    istObjekt(sp) && istZahl(sp.sterne) && istListe(sp.stickerAlben, istStringListe) &&
    (sp.letzterStickerTag === null || istString(sp.letzterStickerTag)) && istStringListe(sp.offeneFeier) &&
    istObjekt(ein) && istZahl(ein.tageszielMinuten) && ein.tageszielMinuten > 0 &&
    (roh.letzteSicherung === null || istString(roh.letzteSicherung));
  return gueltig ? (roh as unknown as AppDaten) : null;
}

export function ladeDaten(speicher: Speicher | null, jetzt: Date): LadeErgebnis {
  if (!speicher) {
    return { daten: leereDaten(jetzt), fehler: "Browser-Speicher nicht verfügbar – Fortschritt wird nicht gespeichert." };
  }
  const roh = speicher.getItem(SPEICHER_SCHLUESSEL);
  if (roh === null) return { daten: leereDaten(jetzt), fehler: null };
  let daten: AppDaten | null = null;
  try {
    daten = pruefeDaten(JSON.parse(roh));
  } catch {
    daten = null;
  }
  if (daten) return { daten, fehler: null };
  try {
    speicher.setItem(DEFEKT_PRAEFIX + jetzt.toISOString(), roh);
  } catch {
    // Sicherung der Rohdaten fehlgeschlagen – Meldung unten bleibt gleich
  }
  return {
    daten: leereDaten(jetzt),
    fehler: "Gespeicherte Daten waren unlesbar. Sie wurden beiseitegelegt; bitte eine Sicherung importieren.",
  };
}

export function speichereDaten(speicher: Speicher | null, daten: AppDaten): boolean {
  if (!speicher) return false;
  try {
    speicher.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(daten));
    return true;
  } catch {
    return false;
  }
}

export function exportiere(daten: AppDaten, jetzt: Date): { json: string; daten: AppDaten; dateiname: string } {
  const neu = { ...daten, letzteSicherung: jetzt.toISOString() };
  return {
    json: JSON.stringify(neu, null, 2),
    daten: neu,
    dateiname: `lesestart-sicherung-${tagSchluessel(jetzt)}.json`,
  };
}

export function importiere(text: string): { ok: true; daten: AppDaten } | { ok: false; fehler: string } {
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    return { ok: false, fehler: "Die Datei ist keine gültige JSON-Datei." };
  }
  const daten = pruefeDaten(roh);
  return daten ? { ok: true, daten } : { ok: false, fehler: "Die Datei ist keine Lesestart-Sicherung." };
}

export function sicherungFaellig(daten: AppDaten, jetzt: Date): boolean {
  const seit = new Date(daten.letzteSicherung ?? daten.angelegtAm).getTime();
  return jetzt.getTime() - seit > SICHERUNG_NACH_TAGEN * 24 * 60 * 60 * 1000;
}
```

- [ ] **Step 4:** `npx vitest run src/storage` → PASS

- [ ] **Step 5: Commit** – `git add -A && git commit -m "feat: persist data with validation, backup export and import"`

---

### Task 13: Fortschrittslogik – Wiederholungen, Belohnungen, Freischaltungen, Kontext, Ablauf

**Files:**
- Create: `src/progress/wiederholung.ts`, `src/progress/belohnungen.ts`, `src/progress/freischaltung.ts`, `src/progress/kontext.ts`, `src/progress/ablauf.ts`
- Test: `src/progress/wiederholung.test.ts`, `src/progress/belohnungen.test.ts`, `src/progress/freischaltung.test.ts`, `src/progress/kontext.test.ts`, `src/progress/ablauf.test.ts`

**Interfaces:**
- Consumes: Typen (Task 10), `GeneratorKontext`, `ElementTyp` (Task 4), `Inhalte` (Task 2)
- Produces:
```ts
// wiederholung.ts
export interface LeseErgebnis { text: string; typ: ElementTyp; richtig: boolean }
export function aktualisiereWiederholungen(liste: readonly Wiederholung[], ergebnisse: readonly LeseErgebnis[]): Wiederholung[];
// belohnungen.ts
export const ALBUM_GROESSE = 30;
export const STICKER_MOTIVE: readonly { name: string; sticker: readonly string[] }[];
export function addiereSterne(sp: Spielstand, anzahl: number): Spielstand;
export function vergebeTagesSticker(sp: Spielstand, tag: string): { spielstand: Spielstand; sticker: string | null };
// freischaltung.ts
export const NEU_TAGE = 7;
export function bekannteGrapheme(daten: AppDaten): Set<string>;
export function neueGrapheme(daten: AppDaten, jetzt: Date): Set<string>;
export function schalteUm(daten: AppDaten, graphem: string, jetzt: Date): AppDaten;
export function erledigeFeier(daten: AppDaten, graphem: string): AppDaten;
// kontext.ts
export const KUERZLICH_SITZUNGEN = 2;
export function baueKontext(daten: AppDaten, inhalte: Inhalte, jetzt: Date): GeneratorKontext;
// ablauf.ts
export type Phase = "aufwaermen" | "blatt" | "bonus" | "abschluss";
export function erstePhase(aufwaermAnzahl: number): Phase;
export function nachBlatt(p: { zielBeiStartErreicht: boolean; zielJetztErreicht: boolean; bonusVerfuegbar: boolean }): Phase;
```

- [ ] **Step 1: Failing tests**

`src/progress/wiederholung.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { aktualisiereWiederholungen } from "./wiederholung";

describe("Wiederholungsspeicher", () => {
  it("nimmt Fehler auf und entfernt nach zweimal richtig in Folge", () => {
    let liste = aktualisiereWiederholungen([], [{ text: "Mimi", typ: "wort", richtig: false }]);
    expect(liste).toEqual([{ text: "Mimi", typ: "wort", richtigInFolge: 0 }]);
    liste = aktualisiereWiederholungen(liste, [{ text: "Mimi", typ: "wort", richtig: true }]);
    expect(liste[0].richtigInFolge).toBe(1);
    liste = aktualisiereWiederholungen(liste, [{ text: "Mimi", typ: "wort", richtig: true }]);
    expect(liste).toEqual([]);
  });

  it("ein Fehler setzt die Folge zurück", () => {
    let liste = [{ text: "ma", typ: "silbe" as const, richtigInFolge: 1 }];
    liste = aktualisiereWiederholungen(liste, [{ text: "ma", typ: "silbe", richtig: false }]);
    expect(liste[0].richtigInFolge).toBe(0);
  });

  it("richtige Ergebnisse ohne Eintrag ändern nichts", () => {
    expect(aktualisiereWiederholungen([], [{ text: "am", typ: "silbe", richtig: true }])).toEqual([]);
  });
});
```

`src/progress/belohnungen.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { addiereSterne, ALBUM_GROESSE, STICKER_MOTIVE, vergebeTagesSticker } from "./belohnungen";
import { leereDaten } from "./typen";

const start = () => leereDaten(new Date(2026, 9, 8)).spielstand;

describe("Belohnungen", () => {
  it("jedes Motiv hat 30 verschiedene Sticker", () => {
    for (const motiv of STICKER_MOTIVE) {
      expect(motiv.sticker).toHaveLength(ALBUM_GROESSE);
      expect(new Set(motiv.sticker).size).toBe(ALBUM_GROESSE);
    }
  });

  it("addiert Sterne", () => {
    expect(addiereSterne(start(), 5).sterne).toBe(5);
  });

  it("vergibt höchstens einen Sticker pro Tag", () => {
    const erst = vergebeTagesSticker(start(), "2026-10-08");
    expect(erst.sticker).toBe(STICKER_MOTIVE[0].sticker[0]);
    const nochmal = vergebeTagesSticker(erst.spielstand, "2026-10-08");
    expect(nochmal.sticker).toBeNull();
    expect(nochmal.spielstand).toBe(erst.spielstand);
  });

  it("beginnt nach 30 Stickern ein neues Album mit anderem Motiv", () => {
    let sp = start();
    for (let tag = 1; tag <= ALBUM_GROESSE + 1; tag++) {
      sp = vergebeTagesSticker(sp, `tag-${tag}`).spielstand;
    }
    expect(sp.stickerAlben).toHaveLength(2);
    expect(sp.stickerAlben[0]).toHaveLength(30);
    expect(sp.stickerAlben[1]).toEqual([STICKER_MOTIVE[1].sticker[0]]);
  });
});
```

`src/progress/freischaltung.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { bekannteGrapheme, erledigeFeier, neueGrapheme, schalteUm } from "./freischaltung";
import { leereDaten } from "./typen";

describe("Freischaltung", () => {
  it("schaltet ein und merkt die Feier vor", () => {
    const jetzt = new Date(2026, 9, 8);
    const d = schalteUm(leereDaten(jetzt), "l", jetzt);
    expect([...bekannteGrapheme(d)]).toEqual(["l"]);
    expect(d.spielstand.offeneFeier).toEqual(["l"]);
  });

  it("schaltet wieder aus und entfernt die offene Feier", () => {
    const jetzt = new Date(2026, 9, 8);
    const d = schalteUm(schalteUm(leereDaten(jetzt), "l", jetzt), "l", jetzt);
    expect(bekannteGrapheme(d).size).toBe(0);
    expect(d.spielstand.offeneFeier).toEqual([]);
  });

  it("neu sind Grapheme der letzten 7 Tage", () => {
    let d = leereDaten(new Date(2026, 9, 1));
    d = schalteUm(d, "m", new Date(2026, 8, 20));
    d = schalteUm(d, "l", new Date(2026, 9, 5));
    expect([...neueGrapheme(d, new Date(2026, 9, 8))]).toEqual(["l"]);
  });

  it("erledigeFeier entfernt genau ein Graphem", () => {
    const jetzt = new Date(2026, 9, 8);
    let d = schalteUm(schalteUm(leereDaten(jetzt), "l", jetzt), "t", jetzt);
    d = erledigeFeier(d, "l");
    expect(d.spielstand.offeneFeier).toEqual(["t"]);
  });
});
```

`src/progress/kontext.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { inhalte } from "../content";
import { schalteUm } from "./freischaltung";
import { baueKontext } from "./kontext";
import { leereDaten, type Sitzung } from "./typen";

const sitzung = (id: string, tag: number, gezeigt: string[]): Sitzung => {
  const iso = new Date(2026, 9, tag).toISOString();
  return { id, start: iso, ende: iso, aktiveSekunden: 0, richtig: 0, fehlversuche: 0, gezeigteElemente: gezeigt };
};

describe("baueKontext", () => {
  it("übernimmt bekannte/neue Grapheme, Wiederholungen und die letzten 2 Sitzungen", () => {
    const jetzt = new Date(2026, 9, 8);
    let d = schalteUm(leereDaten(jetzt), "m", new Date(2026, 8, 1));
    d = schalteUm(d, "a", jetzt);
    d = {
      ...d,
      sitzungen: [sitzung("1", 5, ["alt"]), sitzung("2", 6, ["mi"]), sitzung("3", 7, ["ma"])],
      wiederholungen: [{ text: "Mama", typ: "wort", richtigInFolge: 1 }],
    };
    const k = baueKontext(d, inhalte, jetzt);
    expect([...k.bekannt].sort()).toEqual(["a", "m"]);
    expect([...k.neu]).toEqual(["a"]);
    expect([...k.kuerzlich].sort()).toEqual(["ma", "mi"]);
    expect(k.wiederholungen).toEqual([{ text: "Mama", typ: "wort" }]);
    expect(k.inhalte).toBe(inhalte);
  });
});
```

`src/progress/ablauf.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { erstePhase, nachBlatt } from "./ablauf";

describe("Ablauf der Tagesreise", () => {
  it("überspringt leeres Aufwärmen", () => {
    expect(erstePhase(8)).toBe("aufwaermen");
    expect(erstePhase(0)).toBe("blatt");
  });

  it("weiteres Blatt, solange das Ziel offen ist", () => {
    expect(nachBlatt({ zielBeiStartErreicht: false, zielJetztErreicht: false, bonusVerfuegbar: true })).toBe("blatt");
  });

  it("Bonus bzw. Abschluss, wenn das Ziel erreicht ist", () => {
    expect(nachBlatt({ zielBeiStartErreicht: false, zielJetztErreicht: true, bonusVerfuegbar: true })).toBe("bonus");
    expect(nachBlatt({ zielBeiStartErreicht: false, zielJetztErreicht: true, bonusVerfuegbar: false })).toBe("abschluss");
  });

  it("zweite Sitzung am Tag: genau ein Blatt", () => {
    expect(nachBlatt({ zielBeiStartErreicht: true, zielJetztErreicht: true, bonusVerfuegbar: true })).toBe("bonus");
  });
});
```

- [ ] **Step 2:** `npx vitest run src/progress` → FAIL

- [ ] **Step 3: Implementieren**

`src/progress/wiederholung.ts`:
```ts
import type { ElementTyp } from "../generator/typen";
import type { Wiederholung } from "./typen";

export interface LeseErgebnis { text: string; typ: ElementTyp; richtig: boolean }

const ENTFERNEN_NACH = 2;

export function aktualisiereWiederholungen(
  liste: readonly Wiederholung[],
  ergebnisse: readonly LeseErgebnis[],
): Wiederholung[] {
  const nachText = new Map(liste.map((w) => [w.text, { ...w }]));
  for (const e of ergebnisse) {
    const vorhanden = nachText.get(e.text);
    if (!e.richtig) {
      nachText.set(e.text, { text: e.text, typ: e.typ, richtigInFolge: 0 });
    } else if (vorhanden) {
      const folge = vorhanden.richtigInFolge + 1;
      if (folge >= ENTFERNEN_NACH) nachText.delete(e.text);
      else nachText.set(e.text, { ...vorhanden, richtigInFolge: folge });
    }
  }
  return [...nachText.values()];
}
```

`src/progress/belohnungen.ts`:
```ts
import type { Spielstand } from "./typen";

export const ALBUM_GROESSE = 30;

export const STICKER_MOTIVE: readonly { name: string; sticker: readonly string[] }[] = [
  { name: "Tiere", sticker: [..."🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🐔🐧🐦🐤🦆🦉🐴🦄🐝🐞🦋🐢🐙🐬🐳"] },
  { name: "Leckeres", sticker: [..."🍎🍐🍊🍋🍌🍉🍇🍓🫐🍒🍑🥭🍍🥥🥝🍅🥕🌽🥦🥒🍄🥨🧀🥚🥞🍕🍦🍩🍪🧁"] },
  {
    name: "Abenteuer",
    sticker: ["🚀", "🛸", "🌍", "🌙", "⭐", "🌈", "☀️", "⛅", "❄️", "🌊", "🌋", "🏰", "🚂", "🚗", "🚕",
      "🚌", "🚒", "🚑", "🚜", "🚲", "🛴", "⛵", "🚁", "✈️", "🎈", "🎁", "🎨", "🎸", "🥁", "⚽"],
  },
];

export function addiereSterne(sp: Spielstand, anzahl: number): Spielstand {
  return { ...sp, sterne: sp.sterne + anzahl };
}

export function vergebeTagesSticker(sp: Spielstand, tag: string): { spielstand: Spielstand; sticker: string | null } {
  if (sp.letzterStickerTag === tag) return { spielstand: sp, sticker: null };
  const alben = sp.stickerAlben.map((a) => [...a]);
  let aktuell = alben.at(-1);
  if (!aktuell || aktuell.length >= ALBUM_GROESSE) {
    aktuell = [];
    alben.push(aktuell);
  }
  const motiv = STICKER_MOTIVE[(alben.length - 1) % STICKER_MOTIVE.length];
  const sticker = motiv.sticker[aktuell.length];
  aktuell.push(sticker);
  return { spielstand: { ...sp, stickerAlben: alben, letzterStickerTag: tag }, sticker };
}
```

Hinweis: Die ersten beiden Listen nutzen den Spread-Operator auf einen String. Das funktioniert nur für Emojis **ohne** Variation-Selector (`️`); deshalb ist die dritte Liste (mit `☀️`, `❄️`, `✈️`) explizit als Array geschrieben. Der Test „30 verschiedene Sticker“ fängt Fehler hier ab.

`src/progress/freischaltung.ts`:
```ts
import type { AppDaten } from "./typen";

export const NEU_TAGE = 7;

export function bekannteGrapheme(daten: AppDaten): Set<string> {
  return new Set(daten.freischaltungen.map((f) => f.graphem));
}

export function neueGrapheme(daten: AppDaten, jetzt: Date): Set<string> {
  const grenze = jetzt.getTime() - NEU_TAGE * 24 * 60 * 60 * 1000;
  return new Set(daten.freischaltungen.filter((f) => new Date(f.datum).getTime() >= grenze).map((f) => f.graphem));
}

export function schalteUm(daten: AppDaten, graphem: string, jetzt: Date): AppDaten {
  if (bekannteGrapheme(daten).has(graphem)) {
    return {
      ...daten,
      freischaltungen: daten.freischaltungen.filter((f) => f.graphem !== graphem),
      spielstand: { ...daten.spielstand, offeneFeier: daten.spielstand.offeneFeier.filter((g) => g !== graphem) },
    };
  }
  return {
    ...daten,
    freischaltungen: [...daten.freischaltungen, { graphem, datum: jetzt.toISOString() }],
    spielstand: { ...daten.spielstand, offeneFeier: [...daten.spielstand.offeneFeier, graphem] },
  };
}

export function erledigeFeier(daten: AppDaten, graphem: string): AppDaten {
  return {
    ...daten,
    spielstand: { ...daten.spielstand, offeneFeier: daten.spielstand.offeneFeier.filter((g) => g !== graphem) },
  };
}
```

`src/progress/kontext.ts`:
```ts
import type { Inhalte } from "../content/typen";
import type { GeneratorKontext } from "../generator/typen";
import { bekannteGrapheme, neueGrapheme } from "./freischaltung";
import type { AppDaten } from "./typen";

export const KUERZLICH_SITZUNGEN = 2;

export function baueKontext(daten: AppDaten, inhalte: Inhalte, jetzt: Date): GeneratorKontext {
  const letzte = [...daten.sitzungen]
    .sort((a, b) => b.start.localeCompare(a.start))
    .slice(0, KUERZLICH_SITZUNGEN);
  return {
    bekannt: bekannteGrapheme(daten),
    neu: neueGrapheme(daten, jetzt),
    kuerzlich: new Set(letzte.flatMap((s) => s.gezeigteElemente)),
    wiederholungen: daten.wiederholungen.map(({ text, typ }) => ({ text, typ })),
    inhalte,
  };
}
```

`src/progress/ablauf.ts`:
```ts
export type Phase = "aufwaermen" | "blatt" | "bonus" | "abschluss";

export function erstePhase(aufwaermAnzahl: number): Phase {
  return aufwaermAnzahl > 0 ? "aufwaermen" : "blatt";
}

export function nachBlatt(p: { zielBeiStartErreicht: boolean; zielJetztErreicht: boolean; bonusVerfuegbar: boolean }): Phase {
  if (p.zielBeiStartErreicht || p.zielJetztErreicht) return p.bonusVerfuegbar ? "bonus" : "abschluss";
  return "blatt";
}
```

- [ ] **Step 4:** `npm test && npm run typecheck` → PASS

- [ ] **Step 5: Commit** – `git add -A && git commit -m "feat: add repetition store, rewards, unlocks and session flow rules"`

---

### Task 14: UI-Grundgerüst – Startseite, Buchstaben-Feier, Album, Elternbereich (Buchstaben, Einstellungen)

**Files:**
- Create: `src/ui/useAppDaten.ts`, `src/ui/KinderStart.tsx`, `src/ui/Feier.tsx`, `src/ui/StickerAlbum.tsx`, `src/ui/eltern/Elternbereich.tsx`, `src/ui/eltern/Buchstaben.tsx`, `src/ui/eltern/Einstellungen.tsx`, `src/ui/test-hilfen.ts`
- Modify: `src/App.tsx` (ersetzen), `src/styles.css` (ergänzen)
- Test: `src/ui/KinderStart.test.tsx`, `src/ui/eltern/Buchstaben.test.tsx`, `src/ui/eltern/Einstellungen.test.tsx`

**Interfaces:**
- Consumes: `inhalte` (Task 2); `pruefeBuchstabenStand`, `zaehleWoerterMitGraphem` (Task 8); `grossschreiben` (Task 3); `tageswerte`, `tagSchluessel`, `wochenSmileys`, `leseKette` (Task 11); `holeSpeicher`, `ladeDaten`, `speichereDaten`, `sicherungFaellig` (Task 12); `schalteUm`, `erledigeFeier`, `bekannteGrapheme`, `baueKontext`, `STICKER_MOTIVE`, `ALBUM_GROESSE` (Task 13)
- Produces:
```ts
export type Aktualisiere = (f: (d: AppDaten) => AppDaten) => void;           // useAppDaten.ts
export function useAppDaten(): { daten: AppDaten; aktualisiere: Aktualisiere; fehler: string | null };
export function KinderStart(p: { daten: AppDaten; aktualisiere: Aktualisiere; onLos(): void; onAlbum(): void; onEltern(): void }): JSX.Element;
export function Feier(p: { graphem: string; anzahl: number; onFertig(): void }): JSX.Element;
export function StickerAlbum(p: { daten: AppDaten; onZurueck(): void }): JSX.Element;
export function Elternbereich(p: { daten: AppDaten; aktualisiere: Aktualisiere; fehler: string | null; onZurueck(): void }): JSX.Element;
export function Buchstaben(p: { daten: AppDaten; aktualisiere: Aktualisiere }): JSX.Element;
export function Einstellungen(p: { daten: AppDaten; aktualisiere: Aktualisiere }): JSX.Element;
// test-hilfen.ts
export function datenMit(grapheme: string[]): AppDaten;
export function aktualisiereSpy(start: AppDaten): { fn: Aktualisiere & Mock; readonly daten: AppDaten };
```

- [ ] **Step 1: Testhilfe** – `src/ui/test-hilfen.ts`

```ts
import { vi, type Mock } from "vitest";
import { schalteUm } from "../progress/freischaltung";
import { leereDaten, type AppDaten } from "../progress/typen";
import type { Aktualisiere } from "./useAppDaten";

export function datenMit(grapheme: string[]): AppDaten {
  let d = leereDaten(new Date(2026, 8, 1));
  for (const g of grapheme) d = schalteUm(d, g, new Date(2026, 8, 1));
  return { ...d, spielstand: { ...d.spielstand, offeneFeier: [] } };
}

export function aktualisiereSpy(start: AppDaten) {
  let aktuell = start;
  const fn = vi.fn((f: (d: AppDaten) => AppDaten) => { aktuell = f(aktuell); }) as Aktualisiere & Mock;
  return { fn, get daten() { return aktuell; } };
}
```

- [ ] **Step 2: Failing tests**

`src/ui/KinderStart.test.tsx`:
```tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { KinderStart } from "./KinderStart";
import { aktualisiereSpy, datenMit } from "./test-hilfen";

const leer = () => ({ onLos: vi.fn(), onAlbum: vi.fn(), onEltern: vi.fn() });

describe("KinderStart", () => {
  it("ohne Buchstaben: Hinweis statt Los-Knopf", () => {
    const d = datenMit([]);
    render(<KinderStart daten={d} aktualisiere={vi.fn()} {...leer()} />);
    expect(screen.getByText("Hier gibt's bald was zu lesen!")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Los geht/ })).toBeNull();
  });

  it("mit M, I, A: Los-Knopf startet die Tagesreise", async () => {
    const cb = leer();
    render(<KinderStart daten={datenMit(["m", "i", "a"])} aktualisiere={vi.fn()} {...cb} />);
    await userEvent.click(screen.getByRole("button", { name: /Los geht/ }));
    expect(cb.onLos).toHaveBeenCalled();
  });

  it("zeigt die Buchstaben-Feier und erledigt sie", async () => {
    const d = datenMit(["m", "i", "a"]);
    const mitFeier = { ...d, spielstand: { ...d.spielstand, offeneFeier: ["i"] } };
    const spy = aktualisiereSpy(mitFeier);
    render(<KinderStart daten={mitFeier} aktualisiere={spy.fn} {...leer()} />);
    expect(screen.getByText(/Neu freigeschaltet/)).toBeInTheDocument();
    expect(screen.getByText(/Jetzt kannst du 4 Wörter mit I lesen/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Juhu!" }));
    expect(spy.daten.spielstand.offeneFeier).toEqual([]);
  });
});
```

`src/ui/eltern/Buchstaben.test.tsx`:
```tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Buchstaben } from "./Buchstaben";
import { aktualisiereSpy, datenMit } from "../test-hilfen";

describe("Buchstaben verwalten", () => {
  it("schaltet einen Buchstaben per Klick frei", async () => {
    const spy = aktualisiereSpy(datenMit([]));
    render(<Buchstaben daten={datenMit([])} aktualisiere={spy.fn} />);
    await userEvent.click(screen.getByRole("button", { name: /^M m/ }));
    expect(spy.daten.freischaltungen.map((f) => f.graphem)).toEqual(["m"]);
  });

  it("zeigt bekannte Buchstaben als gedrückt und warnt bei fehlendem Vokal", () => {
    render(<Buchstaben daten={datenMit(["m"])} aktualisiere={() => {}} />);
    expect(screen.getByRole("button", { name: /^M m/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Vokal");
  });
});
```

`src/ui/eltern/Einstellungen.test.tsx`:
```tsx
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Einstellungen } from "./Einstellungen";
import { aktualisiereSpy, datenMit } from "../test-hilfen";

describe("Einstellungen", () => {
  it("ändert das Tagesziel", () => {
    const spy = aktualisiereSpy(datenMit([]));
    render(<Einstellungen daten={datenMit([])} aktualisiere={spy.fn} />);
    fireEvent.change(screen.getByLabelText(/Tagesziel/), { target: { value: "15" } });
    expect(spy.daten.einstellungen.tageszielMinuten).toBe(15);
  });

  it("ignoriert ungültige Werte", () => {
    const spy = aktualisiereSpy(datenMit([]));
    render(<Einstellungen daten={datenMit([])} aktualisiere={spy.fn} />);
    fireEvent.change(screen.getByLabelText(/Tagesziel/), { target: { value: "0" } });
    expect(spy.daten.einstellungen.tageszielMinuten).toBe(10);
  });
});
```

- [ ] **Step 3:** `npx vitest run src/ui` → FAIL

- [ ] **Step 4: Implementieren**

`src/ui/useAppDaten.ts`:
```ts
import { useCallback, useEffect, useState } from "react";
import type { AppDaten } from "../progress/typen";
import { holeSpeicher, ladeDaten, speichereDaten } from "../storage/storage";

export type Aktualisiere = (f: (d: AppDaten) => AppDaten) => void;

export function useAppDaten() {
  const [speicher] = useState(holeSpeicher);
  const [start] = useState(() => ladeDaten(speicher, new Date()));
  const [daten, setDaten] = useState<AppDaten>(start.daten);
  const [fehler, setFehler] = useState<string | null>(start.fehler);

  const aktualisiere: Aktualisiere = useCallback((f) => setDaten(f), []);

  useEffect(() => {
    if (speicher && !speichereDaten(speicher, daten)) {
      setFehler("Speichern fehlgeschlagen – bitte im Elternbereich eine Sicherung exportieren.");
    }
  }, [daten, speicher]);

  return { daten, aktualisiere, fehler };
}
```

`src/ui/Feier.tsx`:
```tsx
import { motion } from "motion/react";
import { grossschreiben } from "../generator/grapheme";

export function Feier({ graphem, anzahl, onFertig }: { graphem: string; anzahl: number; onFertig(): void }) {
  const gross = grossschreiben(graphem);
  return (
    <div className="overlay" role="dialog" aria-label="Neuer Buchstabe">
      <motion.div
        className="karte feier"
        initial={{ scale: 0.3, rotate: -10, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
      >
        <p>🎉 Neu freigeschaltet:</p>
        <p className="feier-graphem">{gross === graphem ? graphem : `${gross} ${graphem}`}</p>
        {anzahl > 0 && (
          <p>Jetzt kannst du {anzahl} {anzahl === 1 ? "Wort" : "Wörter"} mit {gross} lesen!</p>
        )}
        <button className="haupt" onClick={onFertig}>Juhu!</button>
      </motion.div>
    </div>
  );
}
```

`src/ui/KinderStart.tsx`:
```tsx
import { inhalte } from "../content";
import { pruefeBuchstabenStand, zaehleWoerterMitGraphem } from "../generator";
import { leseKette, tageswerte, tagSchluessel, wochenSmileys } from "../progress/auswertung";
import { erledigeFeier } from "../progress/freischaltung";
import { baueKontext } from "../progress/kontext";
import type { AppDaten } from "../progress/typen";
import { sicherungFaellig } from "../storage/storage";
import { Feier } from "./Feier";
import type { Aktualisiere } from "./useAppDaten";

const WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export function KinderStart(p: {
  daten: AppDaten; aktualisiere: Aktualisiere; onLos(): void; onAlbum(): void; onEltern(): void;
}) {
  const jetzt = new Date();
  const k = baueKontext(p.daten, inhalte, jetzt);
  const stand = pruefeBuchstabenStand(k);
  const ziel = p.daten.einstellungen.tageszielMinuten;
  const heute = tageswerte(p.daten.sitzungen, tagSchluessel(jetzt));
  const fortschritt = Math.min(1, heute.aktiveSekunden / (ziel * 60));
  const smileys = wochenSmileys(p.daten.sitzungen, jetzt, ziel);
  const kette = leseKette(p.daten.sitzungen, jetzt, ziel);
  const feierGraphem = p.daten.spielstand.offeneFeier[0];

  return (
    <main className="seite kinderstart">
      <div className="kopfzeile">
        <span className="sterne">⭐ {p.daten.spielstand.sterne}</span>
        <button className="leise" onClick={p.onEltern}>
          Eltern{sicherungFaellig(p.daten, jetzt) ? " 💾" : ""}
        </button>
      </div>
      <div className="maskottchen" aria-hidden="true">🦊</div>
      <h1>Hallo! Lust zu lesen?</h1>
      <div className="fortschritt" role="progressbar" aria-label="Tagesziel"
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fortschritt * 100)}>
        <div style={{ width: `${fortschritt * 100}%` }} />
      </div>
      <p>Heute gelesen: {heute.richtig} Wörter</p>
      <div className="smileys" aria-label="Wochen-Smileys">
        {WOCHENTAGE.map((tag, i) => (
          <span key={tag} title={tag}>{smileys[i] ? "😊" : "⚪"}<small>{tag}</small></span>
        ))}
      </div>
      <p>{kette > 0 ? `🔗 ${kette} ${kette === 1 ? "Tag" : "Tage"} in Folge` : "🔗 Neue Kette!"}</p>
      {stand.ok
        ? <button className="haupt gross" onClick={p.onLos}>Los geht's!</button>
        : <p className="hinweis">Hier gibt's bald was zu lesen!</p>}
      <button onClick={p.onAlbum}>🎁 Sticker-Album</button>
      {feierGraphem && (
        <Feier
          graphem={feierGraphem}
          anzahl={zaehleWoerterMitGraphem(k, feierGraphem)}
          onFertig={() => p.aktualisiere((d) => erledigeFeier(d, feierGraphem))}
        />
      )}
    </main>
  );
}
```

Hinweis: Im Test zur Feier sind 4 Wörter mit `i` lesbar (Mami, Mia, Mimi, im) – siehe Task 8.

`src/ui/StickerAlbum.tsx`:
```tsx
import { ALBUM_GROESSE, STICKER_MOTIVE } from "../progress/belohnungen";
import type { AppDaten } from "../progress/typen";

export function StickerAlbum({ daten, onZurueck }: { daten: AppDaten; onZurueck(): void }) {
  const alben = daten.spielstand.stickerAlben.length > 0 ? daten.spielstand.stickerAlben : [[]];
  return (
    <main className="seite">
      <button onClick={onZurueck}>← Zurück</button>
      {alben.map((album, i) => (
        <section key={i}>
          <h2>Album {i + 1}: {STICKER_MOTIVE[i % STICKER_MOTIVE.length].name}</h2>
          <div className="album">
            {Array.from({ length: ALBUM_GROESSE }, (_, j) => (
              <span key={j} className={album[j] ? "sticker" : "sticker leer"}>{album[j] ?? "?"}</span>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
```

`src/ui/eltern/Buchstaben.tsx`:
```tsx
import { inhalte } from "../../content";
import { pruefeBuchstabenStand } from "../../generator";
import { grossschreiben } from "../../generator/grapheme";
import { schalteUm } from "../../progress/freischaltung";
import { baueKontext } from "../../progress/kontext";
import type { AppDaten } from "../../progress/typen";
import type { Aktualisiere } from "../useAppDaten";

export function Buchstaben({ daten, aktualisiere }: { daten: AppDaten; aktualisiere: Aktualisiere }) {
  const datum = new Map(daten.freischaltungen.map((f) => [f.graphem, f.datum]));
  const stand = pruefeBuchstabenStand(baueKontext(daten, inhalte, new Date()));
  const gruppe = (typ: "vokal" | "konsonant") =>
    inhalte.inventar.filter((i) => i.typ === typ).map((info) => {
      const an = datum.has(info.g);
      const gross = grossschreiben(info.g);
      return (
        <button key={info.g} aria-pressed={an} className={an ? "graphem an" : "graphem"}
          onClick={() => aktualisiere((d) => schalteUm(d, info.g, new Date()))}>
          {gross === info.g ? info.g : `${gross} ${info.g}`}
          {an && <small>{new Date(datum.get(info.g)!).toLocaleDateString("de-DE")}</small>}
        </button>
      );
    });
  return (
    <section>
      {!stand.ok && (
        <p role="alert" className="hinweis">
          Es fehlt noch ein {stand.fehlt === "vokal" ? "Vokal (z. B. A)" : "Konsonant (z. B. M)"} – sonst kann nichts erzeugt werden.
        </p>
      )}
      <h3>Vokale</h3>
      <div className="graphem-raster">{gruppe("vokal")}</div>
      <h3>Konsonanten</h3>
      <div className="graphem-raster">{gruppe("konsonant")}</div>
      <p className="leise">Tipp: Neue Wörter für einen Buchstaben in Claude Code mit <code>/neue-woerter</code> ergänzen.</p>
    </section>
  );
}
```

`src/ui/eltern/Einstellungen.tsx`:
```tsx
import type { AppDaten } from "../../progress/typen";
import type { Aktualisiere } from "../useAppDaten";

export function Einstellungen({ daten, aktualisiere }: { daten: AppDaten; aktualisiere: Aktualisiere }) {
  return (
    <section>
      <label>
        Tagesziel (Minuten aktive Lesezeit){" "}
        <input type="number" min={1} max={60} defaultValue={daten.einstellungen.tageszielMinuten}
          onChange={(e) => {
            const wert = Number(e.target.value);
            if (!Number.isInteger(wert) || wert < 1 || wert > 60) return;
            aktualisiere((d) => ({ ...d, einstellungen: { ...d.einstellungen, tageszielMinuten: wert } }));
          }} />
      </label>
    </section>
  );
}
```

`src/ui/eltern/Elternbereich.tsx`:
```tsx
import { useState } from "react";
import type { AppDaten } from "../../progress/typen";
import type { Aktualisiere } from "../useAppDaten";
import { Buchstaben } from "./Buchstaben";
import { Einstellungen } from "./Einstellungen";

const TABS = ["Buchstaben", "Einstellungen"] as const;
type Tab = (typeof TABS)[number];

export function Elternbereich(p: { daten: AppDaten; aktualisiere: Aktualisiere; fehler: string | null; onZurueck(): void }) {
  const [tab, setTab] = useState<Tab>("Buchstaben");
  return (
    <main className="seite eltern">
      <div className="kopfzeile nicht-drucken">
        <button onClick={p.onZurueck}>← Zum Kind</button>
        <nav className="tabs">
          {TABS.map((t) => (
            <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>{t}</button>
          ))}
        </nav>
      </div>
      {p.fehler && <p role="alert" className="hinweis fehler">{p.fehler}</p>}
      {tab === "Buchstaben" && <Buchstaben daten={p.daten} aktualisiere={p.aktualisiere} />}
      {tab === "Einstellungen" && <Einstellungen daten={p.daten} aktualisiere={p.aktualisiere} />}
    </main>
  );
}
```

`src/App.tsx`:
```tsx
import { useState } from "react";
import { Elternbereich } from "./ui/eltern/Elternbereich";
import { KinderStart } from "./ui/KinderStart";
import { StickerAlbum } from "./ui/StickerAlbum";
import { useAppDaten } from "./ui/useAppDaten";

type Ansicht = "start" | "reise" | "eltern" | "album";

export default function App() {
  const { daten, aktualisiere, fehler } = useAppDaten();
  const [ansicht, setAnsicht] = useState<Ansicht>("start");
  const zurStart = () => setAnsicht("start");

  if (ansicht === "eltern") return <Elternbereich daten={daten} aktualisiere={aktualisiere} fehler={fehler} onZurueck={zurStart} />;
  if (ansicht === "album") return <StickerAlbum daten={daten} onZurueck={zurStart} />;
  if (ansicht === "reise") return <main className="seite"><p>Tagesreise folgt in Task 15.</p><button onClick={zurStart}>Zurück</button></main>;
  return (
    <KinderStart daten={daten} aktualisiere={aktualisiere}
      onLos={() => setAnsicht("reise")} onAlbum={() => setAnsicht("album")} onEltern={() => setAnsicht("eltern")} />
  );
}
```

An `src/styles.css` anhängen:
```css
.kopfzeile { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
.kinderstart { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.maskottchen { font-size: 96px; }
.sterne { font-size: 1.4rem; font-weight: 700; }
button.gross { font-size: 2rem; padding: 1rem 2.5rem; }
button.leise, .leise { color: var(--leise); }
.fortschritt { width: min(480px, 100%); height: 24px; background: var(--rand); border-radius: 12px; overflow: hidden; }
.fortschritt > div { height: 100%; background: var(--gruen); transition: width 0.5s; }
.smileys { display: flex; gap: 8px; font-size: 2rem; }
.smileys span { display: flex; flex-direction: column; align-items: center; }
.smileys small { font-size: 0.8rem; color: var(--leise); }
.hinweis { background: #fff4d6; border-radius: 12px; padding: 12px 16px; }
.hinweis.fehler { background: #fde3dd; }
.overlay { position: fixed; inset: 0; background: rgba(45, 42, 38, 0.4); display: grid; place-items: center; z-index: 10; }
.karte { background: var(--karte); border-radius: 24px; padding: 32px; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.15); }
.feier-graphem { font-size: 96px; font-weight: 700; margin: 0; }
.album { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; max-width: 480px; }
.sticker { font-size: 40px; text-align: center; background: var(--karte); border-radius: 12px; padding: 8px; }
.sticker.leer { color: var(--rand); }
.tabs { display: flex; gap: 4px; flex-wrap: wrap; }
.tabs button[aria-pressed="true"] { background: var(--akzent); color: #fff; border-color: var(--akzent); }
.graphem-raster { display: flex; flex-wrap: wrap; gap: 8px; }
.graphem { display: flex; flex-direction: column; align-items: center; font-size: 1.4rem; min-width: 72px; }
.graphem.an { background: var(--gruen); border-color: var(--gruen); color: #fff; }
.graphem small { font-size: 0.7rem; }
```

- [ ] **Step 5:** `npm test && npm run typecheck` → PASS. Dann `npm run dev`, im Browser: Elternbereich öffnen, M, I, A freischalten, zurück → Feier erscheint, danach „Los geht's!“ sichtbar. Seite neu laden → Freischaltungen bleiben erhalten.

- [ ] **Step 6: Commit** – `git add -A && git commit -m "feat: add child start screen, letter celebration, album and parent letter settings"`

---

### Task 15: Tagesreise – Aufwärmen, Leseblatt, Bonus, Abschluss, Zeiterfassung

**Files:**
- Create: `src/ui/SternZaehler.tsx`, `src/ui/Aufwaermen.tsx`, `src/ui/LeseblattAnsicht.tsx`, `src/ui/BonusSpiel.tsx`, `src/ui/Abschluss.tsx`, `src/ui/Tagesreise.tsx`
- Modify: `src/App.tsx` (Platzhalter für `"reise"` ersetzen), `src/styles.css` (ergänzen)
- Test: `src/ui/Aufwaermen.test.tsx`, `src/ui/LeseblattAnsicht.test.tsx`, `src/ui/BonusSpiel.test.tsx`, `src/ui/Tagesreise.test.tsx`

**Interfaces:**
- Consumes: `generiere`, `erzeugeLeseblatt`, `erzeugeRng`, Typen (Task 8); Zeitmesser (Task 10); `tageswerte`, `tagSchluessel`, `zielErreicht` (Task 11); `neueSitzung`, `upsertSitzung` (Task 11); `aktualisiereWiederholungen`, `LeseErgebnis`, `addiereSterne`, `vergebeTagesSticker`, `baueKontext`, `erstePhase`, `nachBlatt`, `Phase` (Task 13); `Aktualisiere`, `datenMit`, `aktualisiereSpy` (Task 14)
- Produces:
```ts
export const STERNE_PRO_BLATT = 5;   // Tagesreise.tsx
export interface AufwaermErgebnis { ergebnisse: LeseErgebnis[]; sterne: number }
export function Aufwaermen(p: { elemente: LeseElement[]; onFertig(e: AufwaermErgebnis): void }): JSX.Element;
export function LeseblattAnsicht(p: { blatt: Leseblatt; nummer: number; onFertig(): void }): JSX.Element;
export function BonusSpiel(p: { runden: BonusRunde[]; onFertig(geloest: number): void }): JSX.Element;
export function Abschluss(p: { sticker: string | null; woerterHeute: number; zielErreicht: boolean; bonusGesperrt: boolean; onFertig(): void }): JSX.Element;
export function SternZaehler(p: { sterne: number }): JSX.Element;
export function Tagesreise(p: { daten: AppDaten; aktualisiere: Aktualisiere; onEnde(): void }): JSX.Element;
```

Regeln aus der Spec, die hier umgesetzt werden:
- Aufwärmen: ✓ = Leertaste/Enter, ↻ = Backspace. Ein ↻-Element kommt **einmal** ans Ende zurück und zählt als falsch (auch wenn es danach ✓ bekommt). Jedes ✓ bringt einen Stern.
- Leseblatt: nur „Blatt fertig“; alle Elemente zählen als gelesen; 5 Sterne.
- Nach dem Blatt entscheidet `nachBlatt` (Task 13).
- Abschluss: Ist das Tagesziel erreicht, wird der Tages-Sticker vergeben (max. 1 pro Tag). Ohne Bonus wird „🔒 Bald freigeschaltet!“ gezeigt.
- Die Sitzung wird bei jeder Änderung per `upsertSitzung` gespeichert (Browser kann jederzeit geschlossen werden).
- Leerlauf: 60 s im Aufwärmen/Bonus, 5 min im Leseblatt; Pause-Knopf; jede Eingabe (Taste/Zeiger) setzt fort.
- Bewertungsknöpfe verhindern Fokus (`onPointerDown` → `preventDefault`), damit Enter/Leertaste nicht doppelt auslösen.

- [ ] **Step 1: Failing tests**

`src/ui/Aufwaermen.test.tsx`:
```tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Aufwaermen } from "./Aufwaermen";

const elemente = [{ typ: "silbe" as const, text: "mi" }, { typ: "wort" as const, text: "Mama" }];

describe("Aufwärmen", () => {
  it("Leertaste = richtig, Backspace = nochmal (einmal ans Ende)", async () => {
    const onFertig = vi.fn();
    render(<Aufwaermen elemente={elemente} onFertig={onFertig} />);
    expect(screen.getByText("mi")).toBeInTheDocument();
    await userEvent.keyboard(" ");
    expect(screen.getByText("Mama")).toBeInTheDocument();
    await userEvent.keyboard("{Backspace}");
    expect(screen.getByText("Mama")).toBeInTheDocument(); // kommt zurück
    await userEvent.keyboard("{Enter}");
    expect(onFertig).toHaveBeenCalledWith({
      ergebnisse: [
        { text: "mi", typ: "silbe", richtig: true },
        { text: "Mama", typ: "wort", richtig: false },
      ],
      sterne: 2,
    });
  });

  it("zweites Nochmal schiebt nicht erneut ans Ende", async () => {
    const onFertig = vi.fn();
    render(<Aufwaermen elemente={[elemente[0]]} onFertig={onFertig} />);
    await userEvent.keyboard("{Backspace}");
    await userEvent.keyboard("{Backspace}");
    expect(onFertig).toHaveBeenCalledWith({ ergebnisse: [{ text: "mi", typ: "silbe", richtig: false }], sterne: 0 });
  });

  it("Knöpfe funktionieren wie Tasten", async () => {
    const onFertig = vi.fn();
    render(<Aufwaermen elemente={[elemente[0]]} onFertig={onFertig} />);
    await userEvent.click(screen.getByRole("button", { name: /Richtig/ }));
    expect(onFertig).toHaveBeenCalledTimes(1);
  });
});
```

`src/ui/LeseblattAnsicht.test.tsx`:
```tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LeseblattAnsicht } from "./LeseblattAnsicht";

describe("Leseblatt", () => {
  it("zeigt Zeilen, Bildsätze mit Bild und meldet 'Blatt fertig'", async () => {
    const onFertig = vi.fn();
    const blatt = {
      zeilen: [
        { art: "silben" as const, stern: false, elemente: [{ typ: "silbe" as const, text: "mi" }, { typ: "silbe" as const, text: "ma" }] },
        { art: "saetze" as const, stern: true, elemente: [{
          typ: "satz" as const, text: "Mia im 🚂",
          teile: [{ art: "text" as const, text: "Mia" }, { art: "text" as const, text: "im" }, { art: "bild" as const, emoji: "🚂", wort: "Zug" }],
        }] },
      ],
    };
    render(<LeseblattAnsicht blatt={blatt} nummer={1} onFertig={onFertig} />);
    expect(screen.getByText("Leseblatt 1")).toBeInTheDocument();
    expect(screen.getByText("ma")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Zug" })).toHaveTextContent("🚂");
    await userEvent.click(screen.getByRole("button", { name: /Blatt fertig/ }));
    expect(onFertig).toHaveBeenCalled();
  });
});
```

`src/ui/BonusSpiel.test.tsx`:
```tsx
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BonusSpiel } from "./BonusSpiel";

const runden = [
  { wort: "Oma", optionen: [{ emoji: "👵", richtig: true }, { emoji: "🚂", richtig: false }, { emoji: "🍎", richtig: false }] },
  { wort: "Lama", optionen: [{ emoji: "🌊", richtig: false }, { emoji: "🦙", richtig: true }, { emoji: "🍎", richtig: false }] },
];

describe("Bonusspiel", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("falsche Wahl erlaubt neuen Versuch, richtige führt weiter", () => {
    const onFertig = vi.fn();
    render(<BonusSpiel runden={runden} onFertig={onFertig} />);
    expect(screen.getByText("Oma")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Bild 🚂" }));
    expect(screen.getByText("Oma")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Bild 👵" }));
    act(() => { vi.advanceTimersByTime(800); });
    expect(screen.getByText("Lama")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Bild 🦙" }));
    act(() => { vi.advanceTimersByTime(800); });
    expect(onFertig).toHaveBeenCalledWith(2);
  });
});
```

`src/ui/Tagesreise.test.tsx`:
```tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Tagesreise } from "./Tagesreise";
import { aktualisiereSpy, datenMit } from "./test-hilfen";

describe("Tagesreise", () => {
  it("Aufwärmen → Leseblatt → weiteres Blatt, solange das Ziel offen ist; Sitzung wird gespeichert", async () => {
    const start = datenMit(["m", "i", "a"]);
    const spy = aktualisiereSpy(start);
    const onEnde = vi.fn();
    render(<Tagesreise daten={start} aktualisiere={spy.fn} onEnde={onEnde} />);
    for (let i = 0; i < 8; i++) await userEvent.keyboard(" ");
    expect(screen.getByText("Leseblatt 1")).toBeInTheDocument();
    expect(spy.daten.spielstand.sterne).toBe(8);
    await userEvent.click(screen.getByRole("button", { name: /Blatt fertig/ }));
    expect(screen.getByText("Leseblatt 2")).toBeInTheDocument();
    expect(spy.daten.spielstand.sterne).toBe(13);
    await userEvent.click(screen.getByRole("button", { name: /Sitzung beenden/ }));
    expect(onEnde).toHaveBeenCalled();
    expect(spy.daten.sitzungen).toHaveLength(1);
    expect(spy.daten.sitzungen[0].richtig).toBeGreaterThan(8);
  });

  it("Ziel schon erreicht: nach einem Blatt Abschluss mit Sticker und 🔒-Hinweis", async () => {
    const basis = datenMit(["m", "i", "a"]);
    const iso = new Date().toISOString();
    const start = {
      ...basis,
      sitzungen: [{ id: "frueher", start: iso, ende: iso, aktiveSekunden: 600, richtig: 50, fehlversuche: 0, gezeigteElemente: [] }],
    };
    const spy = aktualisiereSpy(start);
    render(<Tagesreise daten={start} aktualisiere={spy.fn} onEnde={() => {}} />);
    for (let i = 0; i < 8; i++) await userEvent.keyboard(" ");
    await userEvent.click(screen.getByRole("button", { name: /Blatt fertig/ }));
    expect(screen.getByText("Geschafft! 🎉")).toBeInTheDocument();
    expect(screen.getByText(/Bald freigeschaltet/)).toBeInTheDocument();
    expect(spy.daten.spielstand.stickerAlben).toEqual([["🐶"]]);
  });
});
```

- [ ] **Step 2:** `npx vitest run src/ui` → FAIL

- [ ] **Step 3: Implementieren**

`src/ui/SternZaehler.tsx`:
```tsx
import { motion } from "motion/react";

export function SternZaehler({ sterne }: { sterne: number }) {
  return (
    <motion.span key={sterne} className="sterne" initial={{ scale: 1.6 }} animate={{ scale: 1 }} aria-label={`${sterne} Sterne`}>
      ⭐ {sterne}
    </motion.span>
  );
}
```

`src/ui/Aufwaermen.tsx`:
```tsx
import { useEffect, useState, type PointerEvent } from "react";
import type { LeseElement } from "../generator/typen";
import type { LeseErgebnis } from "../progress/wiederholung";

export interface AufwaermErgebnis { ergebnisse: LeseErgebnis[]; sterne: number }

const keinFokus = (e: PointerEvent) => e.preventDefault();

export function Aufwaermen({ elemente, onFertig }: { elemente: LeseElement[]; onFertig(e: AufwaermErgebnis): void }) {
  const [schlange, setSchlange] = useState<number[]>(() => elemente.map((_, i) => i));
  const [falsch, setFalsch] = useState<ReadonlySet<number>>(new Set());
  const [zurueckgestellt, setZurueckgestellt] = useState<ReadonlySet<number>>(new Set());
  const [sterne, setSterne] = useState(0);
  const aktuell = schlange[0];

  function weiter(rest: number[], neuFalsch: ReadonlySet<number>, neuSterne: number) {
    if (rest.length === 0) {
      onFertig({
        ergebnisse: elemente.map((el, i) => ({ text: el.text, typ: el.typ, richtig: !neuFalsch.has(i) })),
        sterne: neuSterne,
      });
      return;
    }
    setSchlange(rest);
  }

  function richtig() {
    if (aktuell === undefined) return;
    setSterne(sterne + 1);
    weiter(schlange.slice(1), falsch, sterne + 1);
  }

  function nochmal() {
    if (aktuell === undefined) return;
    const neuFalsch = new Set(falsch).add(aktuell);
    const rest = schlange.slice(1);
    if (!zurueckgestellt.has(aktuell)) {
      rest.push(aktuell);
      setZurueckgestellt(new Set(zurueckgestellt).add(aktuell));
    }
    setFalsch(neuFalsch);
    weiter(rest, neuFalsch, sterne);
  }

  useEffect(() => {
    const beiTaste = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); richtig(); }
      if (e.key === "Backspace") { e.preventDefault(); nochmal(); }
    };
    window.addEventListener("keydown", beiTaste);
    return () => window.removeEventListener("keydown", beiTaste);
  });

  if (aktuell === undefined) return null;
  return (
    <section className="einzel">
      <p className="lesetext">{elemente[aktuell].text}</p>
      <div className="bewertung">
        <button onPointerDown={keinFokus} onClick={nochmal}>↻ Nochmal</button>
        <button className="haupt" onPointerDown={keinFokus} onClick={richtig}>✓ Richtig</button>
      </div>
      <p className="leise">Noch {schlange.length}</p>
    </section>
  );
}
```

`src/ui/LeseblattAnsicht.tsx`:
```tsx
import type { LeseElement, Leseblatt } from "../generator/typen";

function Element({ el }: { el: LeseElement }) {
  if (!el.teile) return <span className="element">{el.text}</span>;
  return (
    <span className="element satz">
      {el.teile.map((t, i) =>
        t.art === "text"
          ? <span key={i}>{t.text}</span>
          : <span key={i} role="img" aria-label={t.wort} className="bild">{t.emoji}</span>,
      )}
    </span>
  );
}

export function LeseblattAnsicht({ blatt, nummer, onFertig }: { blatt: Leseblatt; nummer: number; onFertig(): void }) {
  return (
    <section className="blatt">
      <h2>Leseblatt {nummer}</h2>
      {blatt.zeilen.map((zeile, i) => (
        <div key={i} className={`zeile ${zeile.art}`}>
          <span className="stern-markierung" aria-hidden="true">{zeile.stern ? "⭐" : ""}</span>
          {zeile.elemente.map((el, j) => <Element key={j} el={el} />)}
        </div>
      ))}
      <button className="haupt gross" onClick={onFertig}>✓ Blatt fertig</button>
    </section>
  );
}
```

`src/ui/BonusSpiel.tsx`:
```tsx
import { motion } from "motion/react";
import { useState } from "react";
import type { BonusOption, BonusRunde } from "../generator/typen";

const WEITER_NACH_MS = 700;

export function BonusSpiel({ runden, onFertig }: { runden: BonusRunde[]; onFertig(geloest: number): void }) {
  const [index, setIndex] = useState(0);
  const [wackelt, setWackelt] = useState<string | null>(null);
  const [geloest, setGeloest] = useState(false);
  const runde = runden[index];

  function waehle(o: BonusOption) {
    if (geloest) return;
    if (!o.richtig) { setWackelt(o.emoji); return; }
    setGeloest(true);
    setTimeout(() => {
      if (index + 1 >= runden.length) { onFertig(runden.length); return; }
      setIndex(index + 1);
      setGeloest(false);
      setWackelt(null);
    }, WEITER_NACH_MS);
  }

  return (
    <section className="einzel">
      <p className="leise">Lies das Wort und tippe auf das passende Bild!</p>
      <p className="lesetext">{runde.wort}</p>
      <div className="optionen">
        {runde.optionen.map((o) => (
          <motion.button
            key={`${index}-${o.emoji}`}
            aria-label={`Bild ${o.emoji}`}
            className={geloest && o.richtig ? "option richtig" : "option"}
            animate={wackelt === o.emoji ? { x: [0, -12, 12, -8, 8, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            onAnimationComplete={() => { if (wackelt === o.emoji) setWackelt(null); }}
            onClick={() => waehle(o)}
          >
            {o.emoji}
          </motion.button>
        ))}
      </div>
      {geloest && <p className="lob">⭐ Super!</p>}
      <p className="leise">Runde {index + 1} von {runden.length}</p>
    </section>
  );
}
```

`src/ui/Abschluss.tsx`:
```tsx
import { motion } from "motion/react";

export function Abschluss(p: {
  sticker: string | null; woerterHeute: number; zielErreicht: boolean; bonusGesperrt: boolean; onFertig(): void;
}) {
  return (
    <section className="einzel">
      {p.sticker && (
        <motion.div className="sticker-gross" initial={{ rotateY: 180, scale: 0.4 }} animate={{ rotateY: 0, scale: 1 }}
          transition={{ duration: 0.8 }}>
          {p.sticker}
        </motion.div>
      )}
      <h2>{p.zielErreicht ? "Geschafft! 🎉" : "Toll gelesen!"}</h2>
      <p>Du hast heute {p.woerterHeute} Wörter gelesen!</p>
      {p.sticker && <p>Ein neuer Sticker für dein Album!</p>}
      {p.zielErreicht && p.bonusGesperrt && <p className="hinweis">🔒 Bonusspiel: Bald freigeschaltet!</p>}
      <button className="haupt gross" onClick={p.onFertig}>Fertig</button>
    </section>
  );
}
```

`src/ui/Tagesreise.tsx`:
```tsx
import { useEffect, useRef, useState } from "react";
import { inhalte } from "../content";
import { erzeugeLeseblatt, erzeugeRng, generiere } from "../generator";
import { erstePhase, nachBlatt, type Phase } from "../progress/ablauf";
import { tageswerte, tagSchluessel, zielErreicht } from "../progress/auswertung";
import { addiereSterne, vergebeTagesSticker } from "../progress/belohnungen";
import { baueKontext } from "../progress/kontext";
import { neueSitzung, upsertSitzung } from "../progress/sitzung";
import type { AppDaten, Sitzung } from "../progress/typen";
import { aktualisiereWiederholungen } from "../progress/wiederholung";
import {
  eingabe, istPausiert, LEERLAUF_BLATT_MS, LEERLAUF_EINZEL_MS, pausiere, setzeLeerlauf, starteZeitmesser, tick,
} from "../progress/zeit";
import { Abschluss } from "./Abschluss";
import { Aufwaermen, type AufwaermErgebnis } from "./Aufwaermen";
import { BonusSpiel } from "./BonusSpiel";
import { LeseblattAnsicht } from "./LeseblattAnsicht";
import { SternZaehler } from "./SternZaehler";
import type { Aktualisiere } from "./useAppDaten";

export const STERNE_PRO_BLATT = 5;

const leerlaufFuer = (phase: Phase) => (phase === "blatt" ? LEERLAUF_BLATT_MS : LEERLAUF_EINZEL_MS);

export function Tagesreise({ daten, aktualisiere, onEnde }: { daten: AppDaten; aktualisiere: Aktualisiere; onEnde(): void }) {
  const [start] = useState(() => {
    const jetzt = new Date();
    const kontext = baueKontext(daten, inhalte, jetzt);
    const tag = tagSchluessel(jetzt);
    return {
      jetzt,
      kontext,
      tag,
      material: generiere(kontext, jetzt.getTime()),
      zielBeiStart: zielErreicht(tageswerte(daten.sitzungen, tag), daten.einstellungen.tageszielMinuten),
    };
  });
  const [phase, setPhase] = useState<Phase>(() => erstePhase(start.material.aufwaermen.length));
  const [blatt, setBlatt] = useState(start.material.leseblatt);
  const [blattNummer, setBlattNummer] = useState(1);
  const [sitzung, setSitzung] = useState<Sitzung>(() => neueSitzung(crypto.randomUUID(), start.jetzt));
  const [abschluss, setAbschluss] = useState({ sticker: null as string | null, zielErreicht: false });
  const [pausiert, setPausiert] = useState(false);
  const zeit = useRef(starteZeitmesser(Date.now(), leerlaufFuer(phase)));
  const ziel = daten.einstellungen.tageszielMinuten;

  useEffect(() => { aktualisiere((d) => upsertSitzung(d, sitzung)); }, [sitzung, aktualisiere]);

  useEffect(() => {
    const takt = setInterval(() => {
      const jetzt = Date.now();
      zeit.current = tick(zeit.current, jetzt);
      setPausiert(istPausiert(zeit.current, jetzt));
      const sekunden = Math.floor(zeit.current.aktivMs / 1000);
      setSitzung((s) => (s.aktiveSekunden === sekunden ? s : { ...s, aktiveSekunden: sekunden, ende: new Date(jetzt).toISOString() }));
    }, 1000);
    const beiEingabe = () => {
      zeit.current = eingabe(zeit.current, Date.now());
      setPausiert(false);
    };
    window.addEventListener("pointerdown", beiEingabe);
    window.addEventListener("keydown", beiEingabe);
    return () => {
      clearInterval(takt);
      window.removeEventListener("pointerdown", beiEingabe);
      window.removeEventListener("keydown", beiEingabe);
    };
  }, []);

  useEffect(() => {
    zeit.current = setzeLeerlauf(zeit.current, Date.now(), leerlaufFuer(phase));
  }, [phase]);

  function aktuellerStand(s: Sitzung): Sitzung {
    zeit.current = tick(zeit.current, Date.now());
    return { ...s, aktiveSekunden: Math.floor(zeit.current.aktivMs / 1000), ende: new Date().toISOString() };
  }

  function zielMit(s: Sitzung): boolean {
    const andere = daten.sitzungen.filter((x) => x.id !== s.id);
    return zielErreicht(tageswerte([...andere, s], start.tag), ziel);
  }

  function beende(s: Sitzung) {
    const erreicht = zielMit(s);
    let sticker: string | null = null;
    if (erreicht) {
      sticker = vergebeTagesSticker(daten.spielstand, start.tag).sticker;
      aktualisiere((d) => ({ ...d, spielstand: vergebeTagesSticker(d.spielstand, start.tag).spielstand }));
    }
    setAbschluss({ sticker, zielErreicht: erreicht });
    setPhase("abschluss");
  }

  function aufwaermenFertig({ ergebnisse, sterne }: AufwaermErgebnis) {
    const richtig = ergebnisse.filter((e) => e.richtig).length;
    const s = aktuellerStand(sitzung);
    setSitzung({
      ...s,
      richtig: s.richtig + richtig,
      fehlversuche: s.fehlversuche + ergebnisse.length - richtig,
      gezeigteElemente: [...s.gezeigteElemente, ...ergebnisse.map((e) => e.text)],
    });
    aktualisiere((d) => ({
      ...d,
      wiederholungen: aktualisiereWiederholungen(d.wiederholungen, ergebnisse),
      spielstand: addiereSterne(d.spielstand, sterne),
    }));
    setPhase("blatt");
  }

  function blattFertig() {
    const elemente = blatt.zeilen.flatMap((z) => z.elemente);
    const s = aktuellerStand(sitzung);
    const neu = {
      ...s,
      richtig: s.richtig + elemente.length,
      gezeigteElemente: [...s.gezeigteElemente, ...elemente.map((e) => e.text)],
    };
    setSitzung(neu);
    aktualisiere((d) => ({ ...d, spielstand: addiereSterne(d.spielstand, STERNE_PRO_BLATT) }));
    const naechste = nachBlatt({
      zielBeiStartErreicht: start.zielBeiStart,
      zielJetztErreicht: zielMit(neu),
      bonusVerfuegbar: start.material.bonus !== null,
    });
    if (naechste === "blatt") {
      setBlatt(erzeugeLeseblatt(start.kontext, erzeugeRng(Date.now())));
      setBlattNummer((n) => n + 1);
    } else if (naechste === "bonus") {
      setPhase("bonus");
    } else {
      beende(neu);
    }
  }

  function bonusFertig(geloest: number) {
    const s = aktuellerStand(sitzung);
    const neu = { ...s, richtig: s.richtig + geloest };
    setSitzung(neu);
    aktualisiere((d) => ({ ...d, spielstand: addiereSterne(d.spielstand, geloest) }));
    beende(neu);
  }

  function sofortBeenden() {
    const s = aktuellerStand(sitzung);
    aktualisiere((d) => upsertSitzung(d, s));
    onEnde();
  }

  function pauseKnopf() {
    if (pausiert) return; // der Zeiger-Druck hat die Pause bereits aufgehoben
    zeit.current = pausiere(zeit.current, Date.now());
    setPausiert(true);
  }

  const heute = tageswerte([...daten.sitzungen.filter((x) => x.id !== sitzung.id), sitzung], start.tag);

  return (
    <main className="seite reise">
      <div className="kopfzeile">
        <SternZaehler sterne={daten.spielstand.sterne} />
        <span className="leise">{Math.floor(heute.aktiveSekunden / 60)} / {ziel} min</span>
        <button onClick={pauseKnopf}>{pausiert ? "▶ Weiter" : "⏸ Pause"}</button>
        <button className="leise" onClick={sofortBeenden}>Sitzung beenden</button>
      </div>
      {pausiert && phase !== "abschluss" && <p className="hinweis">Pause – die Zeit läuft gerade nicht.</p>}
      {phase === "aufwaermen" && <Aufwaermen elemente={start.material.aufwaermen} onFertig={aufwaermenFertig} />}
      {phase === "blatt" && <LeseblattAnsicht key={blattNummer} blatt={blatt} nummer={blattNummer} onFertig={blattFertig} />}
      {phase === "bonus" && start.material.bonus && <BonusSpiel runden={start.material.bonus} onFertig={bonusFertig} />}
      {phase === "abschluss" && (
        <Abschluss sticker={abschluss.sticker} woerterHeute={heute.richtig} zielErreicht={abschluss.zielErreicht}
          bonusGesperrt={start.material.bonus === null} onFertig={onEnde} />
      )}
    </main>
  );
}
```

Hinweis zum ersten Tagesreise-Test: `aktualisiereSpy` rendert die Komponente nicht neu; `daten.spielstand.sterne` im Kopf bleibt deshalb im Test bei 0 – geprüft wird `spy.daten`. In der echten App rendert `App` mit den neuen Daten neu.

`src/App.tsx`: Den Platzhalter für `"reise"` ersetzen durch:
```tsx
  if (ansicht === "reise") return <Tagesreise daten={daten} aktualisiere={aktualisiere} onEnde={zurStart} />;
```
und `import { Tagesreise } from "./ui/Tagesreise";` ergänzen.

An `src/styles.css` anhängen:
```css
.einzel { display: flex; flex-direction: column; align-items: center; gap: 24px; padding-top: 32px; text-align: center; }
.lesetext { font-size: var(--lesegroesse); font-weight: 700; margin: 0; min-height: 1.4em; }
.bewertung { display: flex; gap: 16px; }
.bewertung button { font-size: 1.5rem; padding: 0.75rem 2rem; }
.blatt { background: var(--karte); border-radius: 16px; padding: 24px; }
.zeile { display: flex; align-items: center; flex-wrap: wrap; gap: 0.6em 1.2em; font-size: var(--blattgroesse); padding: 8px 0; border-bottom: 1px solid var(--rand); }
.stern-markierung { width: 1.2em; font-size: 0.7em; }
.satz { display: inline-flex; gap: 0.35em; align-items: center; }
.bild { font-size: 1.1em; }
.optionen { display: flex; gap: 24px; }
.option { font-size: 72px; padding: 16px 24px; }
.option.richtig { background: var(--gruen); border-color: var(--gruen); }
.lob { font-size: 1.6rem; color: var(--gruen); }
.sticker-gross { font-size: 120px; }
```

- [ ] **Step 4:** `npm test && npm run typecheck` → PASS

- [ ] **Step 5: Im Browser prüfen** – `npm run dev`, mit M, I, A: Aufwärmen per Tasten durchspielen, Blatt ansehen (Lesetext ≥ 48 px, Bildsätze mit ⭐), „Blatt fertig“, Pause-Knopf testen, „Sitzung beenden“ → Startseite zeigt die gelesenen Wörter und den Fortschritt. Seite während einer Sitzung neu laden → die bisherige Zeit ist im Fortschrittsbalken erhalten.

- [ ] **Step 6: Commit** – `git add -A && git commit -m "feat: add daily reading journey with warm-up, sheet, bonus and rewards"`

---

### Task 16: Elternbereich – Leseprotokoll, druckbare Wochenübersicht, Sicherung

**Files:**
- Create: `src/ui/eltern/Protokoll.tsx`, `src/ui/eltern/Wochenuebersicht.tsx`, `src/ui/eltern/Sicherung.tsx`
- Modify: `src/ui/eltern/Elternbereich.tsx` (Tabs + Sicherungs-Erinnerung), `src/styles.css`
- Test: `src/ui/eltern/Protokoll.test.tsx`, `src/ui/eltern/Sicherung.test.tsx`

**Interfaces:**
- Consumes: `protokoll`, `wochenUebersicht` (Task 11); `exportiere`, `importiere`, `sicherungFaellig` (Task 12); `Aktualisiere`, `datenMit`, `aktualisiereSpy` (Task 14)
- Produces:
```ts
export function Protokoll(p: { daten: AppDaten }): JSX.Element;
export function Wochenuebersicht(p: { daten: AppDaten }): JSX.Element;
export function Sicherung(p: { daten: AppDaten; aktualisiere: Aktualisiere; bestaetige?: (frage: string) => boolean }): JSX.Element;
```
`bestaetige` ist standardmäßig `window.confirm` und wird im Test ersetzt.

- [ ] **Step 1: Failing tests**

`src/ui/eltern/Protokoll.test.tsx`:
```tsx
// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Protokoll } from "./Protokoll";
import { datenMit } from "../test-hilfen";

describe("Protokoll", () => {
  it("zeigt eine Zeile pro Tag mit Minuten, Elementen, Fehlversuchen und Ziel", () => {
    const iso = new Date(2026, 9, 7, 10).toISOString();
    const daten = {
      ...datenMit(["m"]),
      sitzungen: [{ id: "a", start: iso, ende: iso, aktiveSekunden: 660, richtig: 87, fehlversuche: 3, gezeigteElemente: [] }],
    };
    render(<Protokoll daten={daten} />);
    const zeile = screen.getByRole("row", { name: /07\.10\.2026/ });
    expect(within(zeile).getByText("11")).toBeInTheDocument();
    expect(within(zeile).getByText("87")).toBeInTheDocument();
    expect(within(zeile).getByText("3")).toBeInTheDocument();
    expect(within(zeile).getByText("✅")).toBeInTheDocument();
  });

  it("zeigt einen Hinweis ohne Sitzungen", () => {
    render(<Protokoll daten={datenMit([])} />);
    expect(screen.getByText(/Noch keine Lesezeiten/)).toBeInTheDocument();
  });
});
```

`src/ui/eltern/Sicherung.test.tsx`:
```tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Sicherung } from "./Sicherung";
import { aktualisiereSpy, datenMit } from "../test-hilfen";

const datei = (inhalt: string) => new File([inhalt], "sicherung.json", { type: "application/json" });

describe("Sicherung", () => {
  it("lehnt ungültige Dateien ab und ändert nichts", async () => {
    const spy = aktualisiereSpy(datenMit(["m"]));
    render(<Sicherung daten={datenMit(["m"])} aktualisiere={spy.fn} bestaetige={() => true} />);
    await userEvent.upload(screen.getByLabelText(/Sicherung importieren/), datei("{kaputt"));
    expect(await screen.findByRole("alert")).toHaveTextContent("keine gültige JSON-Datei");
    expect(spy.fn).not.toHaveBeenCalled();
  });

  it("ersetzt die Daten nach Bestätigung", async () => {
    const neu = datenMit(["m", "i", "a"]);
    const spy = aktualisiereSpy(datenMit([]));
    const bestaetige = vi.fn(() => true);
    render(<Sicherung daten={datenMit([])} aktualisiere={spy.fn} bestaetige={bestaetige} />);
    await userEvent.upload(screen.getByLabelText(/Sicherung importieren/), datei(JSON.stringify(neu)));
    expect(await screen.findByText(/importiert/)).toBeInTheDocument();
    expect(bestaetige).toHaveBeenCalled();
    expect(spy.daten).toEqual(neu);
  });

  it("bricht ab, wenn nicht bestätigt wird", async () => {
    const spy = aktualisiereSpy(datenMit([]));
    render(<Sicherung daten={datenMit([])} aktualisiere={spy.fn} bestaetige={() => false} />);
    await userEvent.upload(screen.getByLabelText(/Sicherung importieren/), datei(JSON.stringify(datenMit(["m"]))));
    await screen.findByText(/abgebrochen/);
    expect(spy.fn).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2:** `npx vitest run src/ui/eltern` → FAIL

- [ ] **Step 3: Implementieren**

`src/ui/eltern/Protokoll.tsx`:
```tsx
import { protokoll } from "../../progress/auswertung";
import type { AppDaten } from "../../progress/typen";

export const alsDatum = (tag: string) => {
  const [j, m, t] = tag.split("-");
  return `${t}.${m}.${j}`;
};

export function Protokoll({ daten }: { daten: AppDaten }) {
  const zeilen = protokoll(daten.sitzungen, daten.einstellungen.tageszielMinuten);
  if (zeilen.length === 0) return <p>Noch keine Lesezeiten erfasst.</p>;
  return (
    <table className="tabelle">
      <thead>
        <tr><th>Datum</th><th>Minuten</th><th>Gelesen</th><th>Fehlversuche</th><th>Ziel</th></tr>
      </thead>
      <tbody>
        {zeilen.map((z) => (
          <tr key={z.tag} aria-label={alsDatum(z.tag)}>
            <td>{alsDatum(z.tag)}</td>
            <td>{Math.floor(z.aktiveSekunden / 60)}</td>
            <td>{z.richtig}</td>
            <td>{z.fehlversuche}</td>
            <td>{z.zielErreicht ? "✅" : "–"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

`src/ui/eltern/Wochenuebersicht.tsx`:
```tsx
import { wochenUebersicht } from "../../progress/auswertung";
import type { AppDaten } from "../../progress/typen";
import { alsDatum } from "./Protokoll";

const TAGE = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

export function Wochenuebersicht({ daten }: { daten: AppDaten }) {
  const woche = wochenUebersicht(daten.sitzungen, new Date(), daten.einstellungen.tageszielMinuten);
  return (
    <section className="druckbereich">
      <h2>Lesenachweis: Woche vom {alsDatum(woche[0].tag)} bis {alsDatum(woche[6].tag)}</h2>
      <table className="tabelle">
        <thead><tr><th>Tag</th><th>Datum</th><th>Minuten gelesen</th><th>Wörter gelesen</th><th>😊</th></tr></thead>
        <tbody>
          {woche.map((z, i) => (
            <tr key={z.tag}>
              <td>{TAGE[i]}</td>
              <td>{alsDatum(z.tag)}</td>
              <td>{Math.floor(z.aktiveSekunden / 60)}</td>
              <td>{z.richtig}</td>
              <td>{z.zielErreicht ? "😊" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="unterschrift">Unterschrift: ______________________________</p>
      <button className="nicht-drucken haupt" onClick={() => window.print()}>🖨️ Drucken</button>
    </section>
  );
}
```

`src/ui/eltern/Sicherung.tsx`:
```tsx
import { useState } from "react";
import type { AppDaten } from "../../progress/typen";
import { exportiere, importiere } from "../../storage/storage";
import type { Aktualisiere } from "../useAppDaten";

export function Sicherung({ daten, aktualisiere, bestaetige = (f) => window.confirm(f) }: {
  daten: AppDaten; aktualisiere: Aktualisiere; bestaetige?: (frage: string) => boolean;
}) {
  const [meldung, setMeldung] = useState<{ text: string; fehler: boolean } | null>(null);

  function exportieren() {
    const { json, daten: neu, dateiname } = exportiere(daten, new Date());
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = dateiname;
    a.click();
    URL.revokeObjectURL(url);
    aktualisiere((d) => ({ ...d, letzteSicherung: neu.letzteSicherung }));
    setMeldung({ text: `Sicherung „${dateiname}“ gespeichert.`, fehler: false });
  }

  async function importieren(datei: File | undefined) {
    if (!datei) return;
    const ergebnis = importiere(await datei.text());
    if (!ergebnis.ok) { setMeldung({ text: ergebnis.fehler, fehler: true }); return; }
    if (!bestaetige("Alle aktuellen Daten werden durch die Sicherung ersetzt. Fortfahren?")) {
      setMeldung({ text: "Import abgebrochen.", fehler: false });
      return;
    }
    aktualisiere(() => ergebnis.daten);
    setMeldung({ text: "Sicherung importiert.", fehler: false });
  }

  return (
    <section>
      <p>
        Letzte Sicherung:{" "}
        {daten.letzteSicherung ? new Date(daten.letzteSicherung).toLocaleDateString("de-DE") : "noch nie"}
      </p>
      <button className="haupt" onClick={exportieren}>💾 Sicherung exportieren</button>
      <p>
        <label>
          Sicherung importieren{" "}
          <input type="file" accept="application/json,.json" onChange={(e) => importieren(e.target.files?.[0])} />
        </label>
      </p>
      {meldung && <p role={meldung.fehler ? "alert" : "status"} className={meldung.fehler ? "hinweis fehler" : "hinweis"}>{meldung.text}</p>}
    </section>
  );
}
```

`src/ui/eltern/Elternbereich.tsx` – Tabs erweitern und Erinnerung einblenden:
```tsx
import { useState } from "react";
import type { AppDaten } from "../../progress/typen";
import { sicherungFaellig } from "../../storage/storage";
import type { Aktualisiere } from "../useAppDaten";
import { Buchstaben } from "./Buchstaben";
import { Einstellungen } from "./Einstellungen";
import { Protokoll } from "./Protokoll";
import { Sicherung } from "./Sicherung";
import { Wochenuebersicht } from "./Wochenuebersicht";

const TABS = ["Buchstaben", "Protokoll", "Woche", "Sicherung", "Einstellungen"] as const;
type Tab = (typeof TABS)[number];

export function Elternbereich(p: { daten: AppDaten; aktualisiere: Aktualisiere; fehler: string | null; onZurueck(): void }) {
  const [tab, setTab] = useState<Tab>("Buchstaben");
  return (
    <main className="seite eltern">
      <div className="kopfzeile nicht-drucken">
        <button onClick={p.onZurueck}>← Zum Kind</button>
        <nav className="tabs">
          {TABS.map((t) => (
            <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>{t}</button>
          ))}
        </nav>
      </div>
      {p.fehler && <p role="alert" className="hinweis fehler nicht-drucken">{p.fehler}</p>}
      {sicherungFaellig(p.daten, new Date()) && tab !== "Sicherung" && (
        <p className="hinweis nicht-drucken">
          💾 Die letzte Sicherung ist über 14 Tage her.{" "}
          <button onClick={() => setTab("Sicherung")}>Jetzt sichern</button>
        </p>
      )}
      {tab === "Buchstaben" && <Buchstaben daten={p.daten} aktualisiere={p.aktualisiere} />}
      {tab === "Protokoll" && <Protokoll daten={p.daten} />}
      {tab === "Woche" && <Wochenuebersicht daten={p.daten} />}
      {tab === "Sicherung" && <Sicherung daten={p.daten} aktualisiere={p.aktualisiere} />}
      {tab === "Einstellungen" && <Einstellungen daten={p.daten} aktualisiere={p.aktualisiere} />}
    </main>
  );
}
```

An `src/styles.css` anhängen:
```css
.tabelle { border-collapse: collapse; width: 100%; background: var(--karte); }
.tabelle th, .tabelle td { border: 1px solid var(--rand); padding: 8px 12px; text-align: left; }
.unterschrift { margin-top: 48px; font-size: 1.2rem; }
@media print { .druckbereich { font-size: 14pt; } }
```

- [ ] **Step 4:** `npm test && npm run typecheck` → PASS

- [ ] **Step 5: Im Browser prüfen** – Wochenübersicht öffnen → Drucken-Vorschau zeigt nur Tabelle + Unterschrift (keine Knöpfe/Tabs). Sicherung exportieren → Datei wird heruntergeladen; dieselbe Datei importieren → Bestätigungsdialog → Daten unverändert vorhanden.

- [ ] **Step 6: Commit** – `git add -A && git commit -m "feat: add reading log, printable week report and backup in parent area"`

---

### Task 17: Claude-Skill `neue-woerter`, README und Endprüfung

**Files:**
- Create: `.claude/skills/neue-woerter/SKILL.md`, `README.md`
- Modify: `AGENTS.md` (Abschnitt „Befehle“)

- [ ] **Step 1: Skill anlegen** – `.claude/skills/neue-woerter/SKILL.md`

````markdown
---
name: neue-woerter
description: Erweitert die Wortliste der Lese-App um kindgerechte Wörter für einen neu gelernten Buchstaben (z. B. "/neue-woerter L"). Verwenden, wenn ein neuer Buchstabe oder Laut (auch sch, ei, au …) dazukommt.
---

# Neue Wörter für einen Buchstaben

Argument: das neue Graphem, z. B. `L`, `sch`, `ei`. Fehlt es, frage nach.

## 1. Stand lesen
- `content/grapheme.json` – das Graphem muss dort existieren (klein geschrieben). Wenn nicht: abbrechen und melden.
- Welche Grapheme das Kind kann, steht nur im Browser. **Frage den Elternteil**, welche Buchstaben bereits bekannt sind (inkl. des neuen), falls er sie nicht mitgegeben hat.
- `content/woerter.json`, `content/bilder.json`, `content/schablonen.json`, `content/sperrliste.json` lesen.

## 2. Wörter erzeugen (10–30, Qualität vor Menge)
Jedes neue Wort muss
- **das neue Graphem enthalten** und sich **vollständig** in bekannte Grapheme zerlegen lassen. Zerlegung: von links nach rechts jeweils das längste Graphem aus `grapheme.json` (`sch` vor `s`, `ei` vor `e`); `st`/`sp` nur am Wortanfang. Wenn die gierige Zerlegung falsch wäre (z. B. `Familie` → endet sonst auf `ie`), ein Feld `"zerlegung": ["f","a","m","i","l","i","e"]` angeben.
- aus der Erfahrungswelt eines Erstklässlers stammen (Familie, Tiere, Essen, Spielen, Schule, Natur), keine Fremdwörter, nichts Gruseliges oder Unangenehmes, nichts aus der Sperrliste.
- Nomen und Namen großgeschrieben; `"typ": "name"` für Namen und Personen (Mama, Oma, Lola …), sonst `"wort"`.
- Wenn es sich gut als Emoji darstellen lässt: `"emoji"` + `"kategorie"` (z. B. `Tiere`, `Essen`, `Familie`, `Natur`, `Fahrzeuge`, `Dinge`). Nur eindeutige Emojis verwenden.
- Kein Duplikat (Groß/klein egal) zu vorhandenen Einträgen.

## 3. Satzschablonen und Bilder
- Prüfen, ob durch das neue Graphem neue einfache Satzschablonen möglich werden (feste Wörter nur aus bekannten Graphemen), z. B. mit L, T: `["[Name]", "malt", "[Ding]"]`, mit O, S, T: `["Oma", "ist", "im", "[Ort-im]"]`.
- Bild-Platzhalter nutzen vorhandene Etiketten (`Ort-im`, `Ort-am`, `Ding`) oder ein neues Etikett. Ein neues Etikett braucht mindestens ein Bild in `bilder.json` mit diesem Etikett. Bilder müssen grammatisch und inhaltlich passen (`am 🌊` ja, `im 🌊` nein).

## 4. Eintragen und prüfen
- Neue Einträge direkt in die JSON-Dateien schreiben (Formatierung beibehalten).
- `npm run check-content` ausführen; alle Fehler beheben, bis es grün ist.
- `npm test` ausführen.

## 5. Ergebnis zeigen
Eine kurze Liste ausgeben: neue Wörter (mit Emoji), neue Schablonen, neue Bilder. Den Elternteil bitten, Unpassendes zu nennen; diese Einträge dann wieder entfernen und erneut prüfen. Nicht committen, außer der Elternteil möchte es.
````

- [ ] **Step 2: README anlegen** – `README.md`

````markdown
# Lesestart

Lese-App für Leseanfänger: erzeugt täglich frische Silben, Wörter und Bildsätze aus den bekannten Buchstaben, misst die Lesezeit und belohnt mit Sternen und Stickern.

Konzept: `docs/superpowers/specs/2026-10-08-lese-app-design.md`

## Starten

```bash
npm install
npm run dev
```

## Befehle

| Befehl | Zweck |
|---|---|
| `npm run dev` | App lokal starten |
| `npm test` | alle Tests |
| `npm run typecheck` | Typprüfung |
| `npm run check-content` | Inhalte in `content/` prüfen |
| `npm run build` | statische Seite nach `dist/` bauen |

## Neuer Buchstabe

1. In Claude Code: `/neue-woerter L` – ergänzt passende Wörter in `content/`.
2. In der App: Elternbereich → Buchstaben → `L` anklicken.

## Daten

Alles liegt im Browser (`localStorage`). Im Elternbereich regelmäßig **Sicherung exportieren**.
````

- [ ] **Step 3: AGENTS.md ergänzen** – folgenden Abschnitt am Ende anfügen:

```markdown
## Befehle

- `npm test`, `npm run typecheck`, `npm run check-content` – alle drei müssen vor jedem Commit grün sein.
- Inhalte (`content/*.json`) nur über den Skill `/neue-woerter` oder mit anschließendem `npm run check-content` ändern.
```

- [ ] **Step 4: Endprüfung**

```bash
npm test
npm run typecheck
npm run check-content
npm run build
```

Erwartung: alles grün; `dist/` entsteht. Danach `npm run dev` und ein vollständiger Durchlauf im Browser:
1. Leerer Start → „Hier gibt's bald was zu lesen!“.
2. Elternbereich: M, I, A freischalten → zurück → Feier für jeden Buchstaben → „Los geht's!“.
3. Aufwärmen mit Tasten, ein Element mit ↻ → kommt zurück.
4. Leseblatt: 2 Buchstaben-, 2 Silben-, 3 Wort- und 4 ⭐-Satzzeilen; Schrift Andika (einstöckiges „a“).
5. Tagesziel zum Testen in den Einstellungen auf 1 Minute setzen → nach dem Blatt Abschluss mit Sticker und 🔒-Hinweis.
6. Protokoll und Wochenübersicht zeigen den Tag; Druckvorschau ohne Knöpfe.
7. Sicherung exportieren und wieder importieren.
8. Tagesziel zurück auf 10 Minuten.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs: add word-list skill, README and project commands"
```
