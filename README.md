# Lesestart

First Reader für Leseanfänger: erzeugt täglich frische Silben, Wörter und Bildsätze aus den bekannten Buchstaben, misst die Lesezeit und belohnt mit Sternen und Stickern.

Konzept: `docs/superpowers/specs/2026-10-08-first-reader-design.md`

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
| `npm run coverage-content` | zeigt für typische Buchstaben-Reihenfolgen, wie viel Material nach jedem Buchstaben lesbar ist |
| `npm run build` | statische Seite nach `dist/` bauen |

## Inhalte

Die App bringt eine vollständige, geprüfte Erstausstattung für alle 43 Grapheme mit (`content/`): rund 600 Wörter und Namen, gut 240 davon mit Bild fürs Bonusspiel, 39 Satzschablonen und 135 Bilder. Angezeigt werden immer nur Wörter, deren Buchstaben alle freigeschaltet sind – die Reihenfolge, in der die Schule Buchstaben einführt, ist also egal.

## Neuer Buchstabe

In der App: Elternbereich → Buchstaben → z. B. `L` anklicken. Mehr ist nicht nötig.

Optional (mit Claude Code): `/neue-woerter L` ergänzt oder verbessert Wörter, Schablonen und Bilder für diesen Buchstaben, z. B. Lieblingswörter oder Namen aus der Klasse.

## Daten und Datenschutz

- Alles liegt nur im Browser auf dem jeweiligen Gerät (`localStorage`). Es gibt kein Konto, kein Tracking, keine Cookies; die App überträgt nichts ins Internet (auch die Schrift ist eingebaut).
- Werden die Browserdaten gelöscht oder ein anderes Gerät/ein anderer Browser benutzt, ist der Fortschritt weg. Deshalb im Elternbereich unter **Sicherung** regelmäßig exportieren (die App erinnert nach 14 Tagen) und die Datei aufbewahren.
