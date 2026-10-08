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
