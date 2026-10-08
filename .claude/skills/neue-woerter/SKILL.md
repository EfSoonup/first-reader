---
name: neue-woerter
description: Ergänzt oder verbessert die mitgelieferte Wortliste der Lese-App (Wörter, Namen, Satzschablonen, Bilder), z. B. für einen gerade gelernten Buchstaben ("/neue-woerter L") oder mit Lieblingswörtern/Namen aus der Klasse. Verwenden, wenn Inhalte in content/ ergänzt, korrigiert oder gestrichen werden sollen.
---

# Wortliste ergänzen oder verbessern

Die App bringt bereits eine vollständige, geprüfte Liste für alle Grapheme mit (`content/`, rund 600 Einträge). Dieser Skill ist **nicht nötig**, damit die App funktioniert – er dient zum Ergänzen und Verbessern.

Argument (optional): ein Graphem, z. B. `L`, `sch`, `ei`, oder ein Wunsch wie „Namen aus der Klasse: Jule, Ben“. Fehlt beides, frage, was ergänzt oder verbessert werden soll.

## 1. Stand lesen
- `content/grapheme.json` – ein genanntes Graphem muss dort existieren (klein geschrieben). Wenn nicht: abbrechen und melden.
- `content/woerter.json`, `content/bilder.json`, `content/schablonen.json`, `content/sperrliste.json` lesen.
- `npm run coverage-content` zeigt, wie viel Material nach jedem Buchstaben lesbar ist. Welche Buchstaben das Kind kann, steht nur im Browser; frage den Elternteil danach, wenn es für die Auswahl wichtig ist.

## 2. Wörter erzeugen (Qualität vor Menge, meist 5–30)
Jedes neue Wort muss
- sich **vollständig** in Grapheme aus `grapheme.json` zerlegen lassen (bei einem genannten Graphem: es enthalten). Zerlegung: von links nach rechts jeweils das längste Graphem (`sch` vor `s`, `ei` vor `e`); `st`/`sp` nur am Wortanfang.
- **gierig richtig zerlegt** werden. Wenn nicht, ein Feld `"zerlegung"` angeben, z. B. `Familie` → `["f","a","m","i","l","i","e"]`, `Marienkäfer` (`ri-en`, nicht `ie`), `Pfannkuchen` (`n-k`, nicht `nk`). Wörter mit `ai` (Hai, Mai, Mais) weglassen – `ai` ist kein eigenes Graphem.
- aus der Erfahrungswelt eines Erstklässlers stammen (Familie, Tiere, Essen, Spielen, Schule, Natur, Körper, Fahrzeuge, Kleidung), keine Fremdwörter, nichts Gruseliges oder Unangenehmes, nichts, was einen Eintrag der Sperrliste enthält (auch als Teilwort, z. B. `Scheibe` → `schei`).
- Nomen und Namen großgeschrieben; `"typ": "name"` für Namen und Personen, die ohne Artikel stehen (Mia, Mama, Oma …), sonst `"wort"`.
- Wenn es sich eindeutig als Emoji darstellen lässt: `"emoji"` + `"kategorie"` (`Familie`, `Tiere`, `Essen`, `Natur`, `Wetter`, `Fahrzeuge`, `Spielen`, `Schule`, `Dinge`, `Orte`, `Körper`, `Kleidung`). Jedes Emoji nur **einmal** in der Wortliste; steht es auch in `bilder.json`, dieselbe Kategorie verwenden. Möglichst verbreitete Emojis (bis Emoji-Version 12), damit sie auch auf älteren Tablets angezeigt werden.
- Kein Duplikat (Groß/klein egal) zu den vorhandenen ~600 Einträgen.

## 3. Satzschablonen und Bilder
- Feste Wörter nur gängige Funktionswörter und Verben (ist, im, am, malt, sieht, mag, hat, isst, und, mit, auf, unter …).
- Bild-Platzhalter und ihre Bedeutung (das Bild ersetzt das **ganze** Nomen samt Artikel):

  | Etikett | passt in | Beispiel |
  |---|---|---|
  | `Ort-im` | „im …“ (nur maskulin/neutral!) | im 🚂, im 🌲 – nicht 🏫 (*in der* Schule) |
  | `Ort-am` | „am …“ (maskulin/neutral) | am 🌊, am 🏔️ |
  | `Ort-auf` / `Ort-unter` | „auf/unter …“ | auf 🐴, unter 🌳 |
  | `Ding` | malt / sieht / Das ist … | malt 🌈 |
  | `Tier` | mag / füttert … | füttert 🐰 |
  | `Essen` / `Getränk` | isst / trinkt … | isst 🍌, trinkt 🥛 |
  | `Spielzeug` | hat / spielt mit / sucht / holt … | spielt mit ⚽ |
  | `Fahrzeug` | fährt mit … | fährt mit 🚌 |
  | `Kleidung` | trägt … | trägt 🧣 |

- Ein neues Etikett braucht mindestens ein Bild in `bilder.json`, und jedes Etikett eines Bildes muss von einer Schablone verwendet werden. Jedes Emoji nur einmal in `bilder.json`.
- Höchstens ein `[Name]` pro Schablone und keine festen Personen-Namen neben `[Name]` (sonst entsteht „Oma ist mit Oma …“); stattdessen z. B. „ich“, „mir“.
- Jede Kombination aus Schablone und Bild muss grammatisch und inhaltlich passen – im Zweifel ein Etikett weglassen.

## 4. Eintragen und prüfen
- Neue Einträge direkt in die JSON-Dateien schreiben (Formatierung beibehalten: ein Eintrag pro Zeile).
- `npm run check-content` ausführen; alle Fehler beheben, bis es grün ist.
- `npm test` und `npm run coverage-content` ausführen.

## 5. Ergebnis zeigen
Eine kurze Liste ausgeben: neue Wörter (mit Emoji), neue Schablonen, neue Bilder. Den Elternteil bitten, Unpassendes zu nennen; diese Einträge dann wieder entfernen und erneut prüfen. Nicht committen, außer der Elternteil möchte es.
