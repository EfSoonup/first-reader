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

## Daten und Datenschutz

- Alles liegt nur im Browser auf dem jeweiligen Gerät (`localStorage`). Es gibt kein Konto, kein Tracking, keine Cookies; die App überträgt nichts ins Internet (auch die Schrift ist eingebaut).
- Werden die Browserdaten gelöscht oder ein anderes Gerät/ein anderer Browser benutzt, ist der Fortschritt weg. Deshalb im Elternbereich unter **Sicherung** regelmäßig exportieren (die App erinnert nach 14 Tagen) und die Datei aufbewahren.
