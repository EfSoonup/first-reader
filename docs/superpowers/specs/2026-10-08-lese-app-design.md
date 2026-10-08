# Lese-App für Leseanfänger – Konzept (MVP)

*Arbeitstitel: „Lesestart“ · Stand: 2026-10-08 · Status: Entwurf zur Freigabe*

---

## 1. Ausgangslage und Ziel

Ein Erstklässler lernt pro Woche 1–2 neue Buchstaben (Groß- und Kleinbuchstaben gleichzeitig). Die Schule gibt Leseblätter mit, die nur bekannte Buchstaben verwenden. Das Kind soll täglich 10 Minuten lesen; das wird bisher von Hand protokolliert und unterschrieben.

**Probleme**
1. **Auswendiglernen:** Nach dem ersten Durchgang kennt das Kind ein Blatt weitgehend auswendig – es liest nicht mehr, es erinnert sich.
2. **Fehlende Abwechslung.**
3. **Kein echtes Tracking** von Lesezeit oder Lesemenge.

**Ziele**
- **Z1 – Frisches Material:** Jede Sitzung erzeugt automatisch neue Buchstaben, Silben, Wörter (echte und Pseudowörter) und Bildsätze – ausschließlich aus den bekannten Buchstaben.
- **Z2 – Tracking:** Lesezeit und gelesene Menge werden automatisch erfasst und sind als Wochenübersicht druckbar (Ersatz für die handschriftliche Liste).
- **Z3 – Motivation:** Das Kind freut sich aufs Lesen; schlanke Spielelemente belohnen Dranbleiben, nie Fehler bestrafen.

**Erfolgskriterien**
- Das Kind bekommt jeden Tag Material, das es nicht auswendig kennt.
- Kein generiertes Element enthält einen unbekannten Buchstaben (außer im Bildfeld eines Bildsatzes).
- Die tägliche Lesezeit ist ohne Handnotiz belegbar.
- Das Kind fragt von sich aus nach der Lese-App (qualitativ).

**Nutzungssituation**
- Ein Erwachsener sitzt immer daneben und bewertet das Lesen.
- Gerät: zunächst Laptop (Maus/Tastatur), später optional Tablet.
- Ein Kind, eine Familie, keine Veröffentlichung im MVP.

## 2. Vorbild: die Schul-Leseblätter

Die App übernimmt den Aufbau der Schulblätter (Beispiele: Leseblatt 1 mit M/I, Leseblatt 2 mit M/I/A):

| Stufe | Beispiel |
|---|---|
| Einzelbuchstaben | `m m i i m` |
| Offene Silben (Konsonant+Vokal) | `mi ma` |
| Geschlossene Silben (Vokal+Konsonant) | `am im` |
| Wörter, Namen **und Pseudowörter** | `Mama Mia Mimi Ama Ima Ami` |
| ⭐ Bildsätze – Bild ersetzt das Nomen | `Mia im 💧`, `Mami am ✈️` |

Weitere Merkmale: schlichte Grundschrift mit einstöckigem „a“, keine Silbenbögen, ⭐ markiert schwierigere Zeilen, Smileys pro Lesedurchgang, Unterschriftsfeld.

## 3. Umfang

**Im MVP**
- Elternbereich: Buchstaben verwalten, Leseprotokoll, druckbare Wochenübersicht, Sicherung exportieren/importieren, Einstellungen.
- Kinderbereich: Startseite, Tagesreise (Aufwärmen → Leseblatt → Bonusspiel), Belohnungen.
- Regelbasierter Generator mit mitgelieferter Wortliste, Bildvorrat (Emojis) und Satzschablonen.
- Lokale Speicherung im Browser.

**Bewusst nicht im MVP**
- Ton, Vorlesen, Spracherkennung (die App ist stumm).
- KI-Generierung (geplante Erweiterung, siehe §10).
- Mehrere Kinder, Benutzerkonten, Cloud-Sync.
- Ranglisten, Avatar-Shop, XP-/Level-Systeme.
- Silbenbögen, Leselineal, Druck von Leseblättern.

## 4. Aufbau der App

### 4.1 Elternbereich

Zugang über einen normalen Knopf auf der Startseite (keine Kindersperre).

- **Buchstaben verwalten:** Raster mit A–Z, Ä, Ö, Ü, ß sowie Lautverbindungen (`ei`, `ie`, `au`, `eu`, `äu`, `ch`, `sch`, `ck`, `pf`, `qu`, `ng`, `nk`, `st`, `sp`). Ein Klick schaltet einen Buchstaben frei; das Datum wird gespeichert. Ein bekannter Buchstabe gilt immer in Groß- **und** Kleinschreibung.
- **Leseprotokoll:** Tabelle pro Tag – aktive Minuten, richtig gelesene Elemente, Fehlversuche, Tagesziel erreicht ja/nein.
- **Wochenübersicht drucken:** Mo–So mit Minuten und gelesenen Wörtern plus Unterschriftsfeld; über die Druckfunktion des Browsers (eigenes Druck-Layout).
- **Sicherung:** Export/Import aller Daten als JSON-Datei. Erinnerung, wenn die letzte Sicherung länger als 14 Tage zurückliegt.
- **Sitzung beenden:** Während einer Tagesreise kann der Erwachsene die Sitzung jederzeit beenden; bis dahin erfasste Zeit und Ergebnisse bleiben gespeichert.

### 4.2 Kinderbereich

**Startseite:** Maskottchen, Tagesfortschritt (Balken in Richtung 10 Minuten), Wochen-Smileys, Lese-Kette, Knopf „Los geht's“, Zugang zum Sticker-Album.

**Tagesreise** – eine Sitzung besteht aus drei Phasen:

1. **🔥 Aufwärmen (Einzelansicht)**
   - 8 Elemente, nacheinander groß in der Bildmitte.
   - Bevorzugt Silben und Wörter mit **neuen Buchstaben** sowie Einträge aus dem **Wiederholungsspeicher**.
   - Bewertung: ✓ (Taste Leertaste/Enter) oder ↻ „nochmal“ (Taste Backspace). Ein mit ↻ bewertetes Element kommt einmal ans Ende der Aufwärm-Runde zurück und landet im Wiederholungsspeicher.
   - Jedes mit ✓ bewertete Element bringt **1 Stern**.

2. **📄 Leseblatt (Blattansicht)**
   - Ein neu generiertes Blatt im Schulstil (Aufbau siehe §5.5), ohne Leselineal.
   - Keine Bewertung einzelner Wörter in der App – der Erwachsene korrigiert mündlich beim Lesen.
   - Knopf **„Blatt fertig“** schließt das Blatt ab: Alle Elemente des Blatts zählen als gelesen; das Blatt bringt **5 Sterne**.
   - Ist das Tagesziel beim Abschluss noch nicht erreicht, folgt direkt ein neues Blatt. Ein Blatt wird nie mittendrin abgebrochen, weil das Ziel erreicht ist.
   - War das Tagesziel schon vor Sitzungsbeginn erreicht (zweite Sitzung am selben Tag), gibt es genau ein Blatt und danach den Bonus.

3. **🎯 Bonus „Wort ↔ Bild“ (Einzelansicht)**
   - Startet, sobald das Tagesziel erreicht ist (nach dem laufenden Blatt).
   - 6 Runden: Ein lesbares Wort wird angezeigt, darunter 3 Bilder; das Kind klickt selbst das passende an. Die App prüft selbst. Richtig → Stern und Freude; falsch → das gewählte Bild wackelt, das Kind darf erneut wählen (keine Strafe).
   - Verfügbar erst ab **mindestens 4 abbildbaren, lesbaren Wörtern**; vorher erscheint es als 🔒 „Bald freigeschaltet!“ und die Tagesreise endet nach dem Leseblatt.

**Abschluss:** Ist das Tagesziel erreicht, deckt das Kind den Tages-Sticker auf (siehe §6.2).

## 5. Generator

### 5.1 Grundsatz

Reine Logik ohne Oberfläche und ohne Speicherzugriff:

```
generiere(bekannteBuchstaben, verlauf, inhalte, seed) → { aufwärmen, leseblatt, bonus }
```

Ein Zufallsgenerator mit Startwert (Seed) macht jede Ausgabe reproduzierbar.

### 5.2 Lesbarkeit eines Wortes

Ein Wort ist **lesbar**, wenn es sich vollständig in bekannte Grapheme zerlegen lässt.

- Zerlegung: von links nach rechts, jeweils das **längste passende Graphem aus dem Gesamtinventar** (z. B. `sch` vor `s`, `ei` vor `e`). Das Ergebnis ist unabhängig davon, was das Kind schon kann – `Schaf` ist also erst lesbar, wenn `sch`, `a` und `f` bekannt sind.
- Groß-/Kleinschreibung wird beim Prüfen ignoriert.
- Für Ausnahmen kann ein Eintrag in der Wortliste eine **explizite Zerlegung** mitbringen (z. B. `Ver-ein` nicht als `Ve-rein`).

### 5.3 Elementtypen

| Typ | Herkunft | Regel |
|---|---|---|
| Buchstabe | bekannte Grapheme | groß und klein gemischt |
| Offene Silbe | algorithmisch | Konsonant + Vokal, z. B. `ma`, `Mi` |
| Geschlossene Silbe | algorithmisch | Vokal + Konsonant, z. B. `am`, `im` |
| Pseudowort | algorithmisch | siehe §5.4 |
| Echtes Wort / Name | Wortliste | nur wenn lesbar (§5.2) |
| Bildsatz | Schablone + Bildvorrat | siehe §5.6 |

### 5.4 Pseudowörter

- Aufbau aus Silbenmustern: KV-KV (`Mimi`), V-KV (`Ama`), KV-V (`Mia`), KV-KVK (`Mamim`). Bis 9 bekannte Grapheme höchstens 2 Silben, ab 10 auch 3 Silben.
- Aussprechbar: Konsonanten und Vokale wechseln sich ab; Konsonantenhäufungen erst, wenn mindestens 10 Grapheme bekannt sind, und dann höchstens 2 Konsonanten in Folge.
- **Sperrliste** verhindert anstößige oder unschöne Ergebnisse.
- Ergibt ein Pseudowort zufällig ein Wort aus der Wortliste, wird es als echtes Wort behandelt.
- Pseudowörter werden großgeschrieben (wirken wie Namen, wie auf dem Schulblatt).

### 5.5 Aufbau des Leseblatts

| Zeilen | Inhalt | Elemente pro Zeile |
|---|---|---|
| 1–2 | Buchstaben (nur solange < 6 Grapheme bekannt) | 8 |
| 2 Zeilen | Silben (offen und geschlossen gemischt) | 8 |
| 2–3 Zeilen | Wörter: ca. 50 % echte Wörter/Namen, Rest Pseudowörter (bei zu wenig echten Wörtern mehr Pseudowörter) | 6 |
| 4–5 ⭐-Zeilen | je ein Bildsatz | 1 |

Gibt es zu wenig Material für eine Zeilenart, entfällt sie bzw. wird gekürzt. Es wird nicht mit identischen Wiederholungen aufgefüllt.

### 5.6 Bildsätze

- Das **Bild ersetzt den gesamten Nominalteil** (inkl. Artikel). Das Bildwort muss daher keine bekannten Buchstaben enthalten.
- **Satzschablonen** bestehen aus festen Wörtern und Platzhaltern, z. B.:
  - `[Name] im [Ort-im]`
  - `[Name] am [Ort-am]`
  - `[Name] malt [Ding]` (benötigt L, T)
  - `Oma ist im [Ort-im]` (benötigt O, S, T)
- Eine Schablone ist nutzbar, wenn alle festen Wörter lesbar sind und mindestens ein lesbarer Name bzw. ein passendes Bild existiert.
- **Bildvorrat:** Jedes Emoji trägt Etiketten, in welche Platzhalter es grammatisch und inhaltlich passt (z. B. 🚂 → `Ort-im`, 🌊 → `Ort-am`, 🏠 → `Ort-im`, `Ding`). So entstehen keine unsinnigen Sätze.
- Der Satzanfang wird großgeschrieben.

### 5.7 Gewichtung und Abwechslung

- **Neue Grapheme** (freigeschaltet in den letzten 7 Tagen): Elemente, die sie enthalten, werden **3× so häufig** gezogen.
- **Wiederholungsspeicher:** Im Aufwärmen mit ↻ bewertete Elemente werden in den folgenden Sitzungen bevorzugt eingeplant (im Aufwärmen bis zu 4 der 8 Plätze), bis sie **zweimal hintereinander** richtig gelesen wurden.
- **Frische:** Elemente aus den letzten 2 Sitzungen werden stark abgewertet (nicht ausgeschlossen – bei kleinem Vorrat ist Wiederholung unvermeidbar).

### 5.8 Bonusspiel-Material

Abbildbare Wörter = Einträge der Wortliste mit Emoji. Pro Runde: ein lesbares abbildbares Wort + 2 andere Bilder als Ablenker (bevorzugt aus anderen Kategorien, damit die Wahl eindeutig ist).

## 6. Tracking und Gamification

### 6.1 Messung

- **Aktive Lesezeit:** Der Timer läuft während der gesamten Tagesreise und pausiert bei Leerlauf:
  - Aufwärmen und Bonus: nach **60 Sekunden** ohne Eingabe.
  - Leseblatt: nach **5 Minuten** ohne Eingabe (bei fehlerfreiem Lesen gibt es dort lange keine Eingabe).
  - Zusätzlich ein sichtbarer **Pause-Knopf**.
  - Die nächste Eingabe setzt den Timer fort.
- **Lesemenge:** richtig gelesene Elemente (Wörter, Silben, Sätze) und Fehlversuche.
- **Tagesziel:** **10 Minuten aktive Lesezeit** (in den Einstellungen änderbar). Mehrere Sitzungen am Tag werden addiert.
- Dem Kind wird die Lesemenge gezeigt („Du hast heute 87 Wörter gelesen!“), dem Erwachsenen zusätzlich die Zeit.

### 6.2 Spielelemente

1. **⭐ Sterne:** Aufwärm-Element ✓ = 1 Stern, Blatt fertig = 5 Sterne, Bonusrunde richtig = 1 Stern. Sterne fliegen sichtbar in einen Zähler. Fehler kosten nie Sterne.
2. **🎁 Sticker-Album:** Pro Tag mit erreichtem Tagesziel wird **ein** Sticker (Tier-Emoji o. ä.) aufgedeckt und eingeklebt. Ein Album hat 30 Plätze; danach beginnt ein neues mit anderem Motiv.
3. **😊 Wochen-Smileys:** 7 Felder (Mo–So); ein Smiley pro Tag mit erreichtem Tagesziel – wie auf dem Schulblatt.
4. **🔗 Lese-Kette:** Anzahl Tage in Folge mit erreichtem Ziel. Reißt die Kette, beginnt sie neutral neu („Neue Kette!“) – ohne Verlust- oder Traurig-Darstellung.
5. **🎉 Buchstaben-Feier:** Nach dem Freischalten eines neuen Graphems zeigt die App beim nächsten Start des Kinderbereichs eine Animation: „Neu: **L**! Jetzt kannst du 23 neue Wörter lesen.“ Die Zahl = lesbare Wörter/Namen der Wortliste, die dieses Graphem enthalten. Sie bleibt dadurch korrekt, egal ob die Wortliste vor oder nach dem Freischalten ergänzt wird.

## 7. Technik

| Bereich | Wahl | Begründung |
|---|---|---|
| Build-Werkzeug | **Vite** | Standard-Werkzeug für moderne Web-Apps; schneller Entwicklungsserver, erzeugt eine statische Seite |
| UI-Framework | **React** | größtes Ökosystem, gut wartbar |
| Sprache | **TypeScript** | Typprüfung, weniger Fehler |
| Tests | **Vitest** | aus der Vite-Familie, keine Zusatzeinrichtung |
| Animationen | **Motion** (ehem. Framer Motion) | Sterne, Sticker, Buchstaben-Feier |
| Styling | einfaches CSS mit CSS-Variablen | kleine Oberfläche, kein CSS-Framework nötig |
| Schrift | **Andika** (SIL, frei), lokal eingebunden | für Leseanfänger entwickelt, einstöckiges „a“ |
| Speicherung | `localStorage`, versioniertes JSON-Schema | Datenmenge winzig, kein Server |

- Kein Backend. Start lokal mit `npm install` (einmalig) und `npm run dev`.
- Darstellung: Lesetext 48–64 px, viel Weißraum, gedeckte Farben; Klickflächen mindestens 48 px (tablet-tauglich).
- **Später optional:** statisches Hosting (z. B. GitHub Pages) und PWA-Plugin für Installation/Offline auf dem Tablet.

### 7.1 Bausteine

| Baustein | Aufgabe | Abhängig von |
|---|---|---|
| `content/` | Wortliste, Namen, Bildvorrat, Satzschablonen, Sperrliste, Grapheminventar (JSON) | – |
| `generator/` | reine Logik: Lesbarkeit, Silben, Pseudowörter, Bildsätze, Gewichtung, Zusammenstellung von Aufwärmen/Blatt/Bonus | `content` |
| `scripts/check-content` | prüft die Inhaltsdateien (Schema, Duplikate, Etiketten, Sperrliste) | `content`, `generator` |
| `.claude/skills/neue-woerter/` | Claude-Skill zum Erweitern der Wortliste (§10) | `content` |
| `progress/` | Sitzungen, Zeiterfassung, Wiederholungsspeicher, Sterne, Sticker, Smileys, Lese-Kette, Buchstaben-Feier | – |
| `storage/` | Laden/Speichern, Schema-Version, Export/Import | `progress` |
| `ui/` | Kinderbereich, Elternbereich, Animationen, Druck-Layout | alle |

### 7.2 Datenmodell (Skizze)

```ts
type Graphem = string;                       // "m", "a", "sch", "ei"

interface Freischaltung { graphem: Graphem; datum: string }   // ISO-Datum

interface Wiederholung {
  text: string;                              // z. B. "Mimi"
  typ: "silbe" | "wort" | "pseudowort" | "satz";
  richtigInFolge: number;                    // ab 2 → entfernt
}

interface Sitzung {
  start: string; ende: string;
  aktiveSekunden: number;
  richtig: number; fehlversuche: number;
  gezeigteElemente: string[];                // für Frische-Abwertung
}

interface Spielstand {
  sterne: number;
  stickerAlben: string[][];                  // je Album bis 30 Sticker
  offeneFeier: Graphem[];                    // noch nicht gefeierte Grapheme
}

interface AppDaten {
  schemaVersion: 1;
  freischaltungen: Freischaltung[];
  sitzungen: Sitzung[];
  wiederholungen: Wiederholung[];
  spielstand: Spielstand;
  einstellungen: { tageszielMinuten: number };
  letzteSicherung?: string;
}
```

Tagesauswertungen (Ziel erreicht, Smileys, Kette, Protokoll) werden aus `sitzungen` berechnet, nicht separat gespeichert.

## 8. Fehlerfälle

| Fall | Verhalten |
|---|---|
| Kein Vokal oder kein Konsonant bekannt | Kinderbereich: „Hier gibt's bald was zu lesen!“; Elternbereich: Hinweis, was fehlt |
| Zu wenig Material für eine Phase/Zeilenart | Phase/Zeile entfällt oder wird gekürzt; die Sitzung bricht nie ab |
| Bonusspiel ohne genug abbildbare Wörter | 🔒-Anzeige, Tagesreise endet nach dem Blatt |
| `localStorage` nicht verfügbar oder Speichern schlägt fehl | Deutlicher Hinweis im Elternbereich; die laufende Sitzung funktioniert weiter im Speicher |
| Import einer ungültigen oder fremden Datei | Ablehnen mit Meldung, vorhandene Daten bleiben unverändert |
| Ältere Schema-Version beim Laden/Import | Migration auf aktuelle Version |

## 9. Tests (Vitest)

Schwerpunkt Generator und Fortschrittslogik:

- **Kernregel (eigenschaftsbasiert):** Für mehrere hundert zufällige Graphem-Mengen enthält kein generiertes Element ein unbekanntes Graphem (Bildfelder ausgenommen).
- Graphem-Zerlegung inkl. Mehrbuchstaben-Graphemen und expliziter Zerlegung.
- Pseudowörter: aussprechbar, nicht auf der Sperrliste, Silbenzahl gemäß Stand.
- Bildsätze nur mit passenden Bild-Etiketten.
- Gleicher Seed → gleiche Ausgabe.
- Gewichtung: neue Grapheme und Wiederholungen tauchen statistisch häufiger auf.
- Wiederholungsspeicher: Eintrag nach 2× richtig in Folge entfernt.
- Zeiterfassung: Leerlauf-Pause (60 s bzw. 5 min) und Pause-Knopf.
- Tagesziel, Smileys, Lese-Kette und Sticker aus Sitzungsdaten korrekt berechnet.
- Buchstaben-Feier: Anzahl lesbarer Wörter mit dem neuen Graphem korrekt.
- Inhaltsprüfung (`npm run check-content`): erkennt Schemafehler, Duplikate, unbekannte Bild-Etiketten und Sperrlisten-Treffer.
- Export → Import ergibt identische Daten; ungültiger Import ändert nichts.

## 10. Inhalte

Die Inhalte liegen als JSON-Dateien in `content/` und **wachsen mit dem Kind**.

**Erstausstattung (klein)**
- Wortliste mit allen sinnvollen Wörtern und Namen für die aktuell bekannten Grapheme (M, I, A): z. B. `Mama`, `Mami`, `Mia`, `Mimi`, `am`, `im` – also nur eine Handvoll Einträge.
- Bildvorrat: ca. 30 Emojis mit Platzhalter-Etiketten. Er hängt nicht von den bekannten Buchstaben ab, weil das Bild nie gelesen werden muss.
- Satzschablonen, die mit dem aktuellen Stand nutzbar sind (`[Name] im [Ort-im]`, `[Name] am [Ort-am]`).
- Sperrliste für Pseudowörter, Grapheminventar (§4.1).

**Erweitern per Claude-Skill `neue-woerter`** (liegt im Projekt unter `.claude/skills/neue-woerter/SKILL.md`)
- **Aufruf:** in Claude Code, z. B. `/neue-woerter L` – sobald die Schule einen neuen Buchstaben einführt.
- **Der Skill liest** das Grapheminventar, die bisherige Wortliste, den Bildvorrat und die Schablonen.
- **Er erzeugt** kindgerechte neue Einträge, die mit den bisherigen Graphemen **plus dem neuen** lesbar sind und das neue Graphem enthalten:
  - Wörter und Namen aus der Erfahrungswelt eines Erstklässlers (Familie, Tiere, Essen, Spielen, Schule); keine Fremdwörter, nichts Unangenehmes; Nomen großgeschrieben.
  - zu jedem abbildbaren Wort ein passendes Emoji (für das Bonusspiel)
  - neue Satzschablonen, die durch das Graphem möglich werden (z. B. mit L, T: `[Name] malt [Ding]`), und ggf. passende neue Bilder
  - Ziel: ca. 10–30 neue Wörter pro Graphem, Qualität vor Menge
- **Er trägt die Einträge direkt in die Dateien ein** (kein manuelles Kopieren), entfernt Duplikate und führt `npm run check-content` aus.
- **Er zeigt eine kurze Liste der Neuzugänge**, damit der Elternteil Unpassendes streichen kann.
- Die App selbst braucht dafür keine Internetverbindung und keinen API-Schlüssel; der Skill läuft nur beim Pflegen der Inhalte.

## 11. Ausblick (nach dem MVP)

- **KI-Erweiterung (Ansatz 3):** optionaler „Überraschungssatz“-Generator über die Claude API, sobald ca. 8 oder mehr Grapheme bekannt sind. Jede KI-Ausgabe läuft durch dieselbe Lesbarkeitsprüfung (§5.2) und wird bei Verstoß verworfen.
- Hosting + PWA für das Tablet.
- Weitere Spielarten, einheitliche Illustrationen statt Emojis, optional Ton.

## 12. Entscheidungsprotokoll

| Entscheidung | Gewählt | Verworfen |
|---|---|---|
| Lesemedium | Bildschirm | Papierblätter drucken, Mischform |
| Bewertung | Aufwärmen: Erwachsener klickt ✓/↻; Leseblatt: nur „Blatt fertig“; Bonusspiel prüft selbst | Wort-Markierung im Leseblatt, Spracherkennung, Selbstbestätigung |
| Kindersperre Elternbereich | keine | 3 s gedrückt halten |
| Wortliste | klein starten, pro neuem Buchstaben per Claude-Skill erweitern | große Liste vorab |
| Generierung | regelbasiert + Wortliste + Emojis, KI später optional | KI von Anfang an |
| Buchstabenpflege | Elternteil trägt wöchentlich ein | fest hinterlegte Fibel-Reihenfolge |
| Ansicht | Hybrid: Einzelansicht (Aufwärmen, Bonus) + Blattansicht | nur Einzel- oder nur Blattansicht |
| Leselineal | nein | ja |
| Ton | stumm | Vorlesen nach Fehlversuch |
| Tagesziel | 10 min aktive Zeit; Wörter als sichtbare „Währung“ fürs Kind | reine Wortanzahl |
| Stack | Vite + React + TypeScript | Svelte, Next.js, reines HTML/JS |
