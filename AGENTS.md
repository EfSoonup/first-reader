# First Reader (privates Projekt)

Lern-App für Leseanfänger (Erstklässler). Konzept: `docs/superpowers/specs/2026-10-08-first-reader-design.md`.

## Wichtig: privates Projekt

- **Nichts zu Firmen-Servern pushen**, dort keinen Remote anlegen, keine Issues/PRs erstellen. Dieses Projekt hat keinerlei Bezug zu einem Arbeitgeber.
- Gepusht wird ausschließlich `main` nach `origin` (privates Konto, siehe unten). Weitere Remotes, Branches oder Tags nur, wenn der Nutzer das ausdrücklich verlangt – **nie `git push --tags` oder `--all`**: lokale `backup/*`-Tags enthalten alte Identitäten.
- Keine Firmen-Tools, -Skills oder -Zugänge in diesem Projekt verwenden.

## Öffentliches Repo

Das Repo ist öffentlich und wird per GitHub Actions nach GitHub Pages deployt (`.github/workflows/deploy.yml`, bei jedem Push auf `main`). Alles, was committet wird, ist für alle sichtbar – auch in der Historie.

- **Keine Geheimnisse:** keine Passwörter, Tokens, Keys. Konfiguration über `.env.local` (gitignored); öffentlich gedachte Werte (z. B. ein Supabase-„anon key“) sind ok, ein `service_role`-Key nie.
- **Keine personenbezogenen Daten:** keine echten E-Mail-Adressen, Nachnamen, Schul- oder Klassennamen, keine Namen konkreter Kinder (auch nicht in Commit-Messages, Specs oder Plänen). In `content/` nur verbreitete Vornamen ohne Bezug zu realen Personen.
- Die Content-Security-Policy wird beim Build in `index.html` eingefügt (`vite.config.ts`). Neue externe Quellen (z. B. ein Backend) dort ergänzen.

## GitHub-Konto und Identität

- Einziges erlaubtes Konto: das private GitHub-Konto **EfSoonup** auf github.com. Niemals GitHub-Enterprise- oder andere Firmen-Hosts.
- Remote-URL ausschließlich über den SSH-Alias `github-privat`: `git@github-privat:EfSoonup/first-reader.git` (Key `~/.ssh/id_ed25519_github_privat`, siehe `~/.ssh/config`).
- Commit-Identität: `EfSoonup <190464499+EfSoonup@users.noreply.github.com>` (GitHub-Noreply-Adresse; die echte E-Mail-Adresse darf nie in Commits oder Dateien auftauchen). Sie kommt automatisch aus `~/.gitconfig-private` (per `includeIf "gitdir:~/repos/private/"`). Keine Firmen-Mail in Commits; im Zweifel `git config user.email` prüfen.
- Der globale Firmen-`pre-push`-Hook ist hier per `core.hooksPath = .git/hooks` abgeschaltet.

## Sprache

- Konzept, UI-Texte und Inhalte: Deutsch.
- Commit-Messages: Englisch.

## Befehle

- `npm test`, `npm run typecheck`, `npm run check-content` – alle drei müssen vor jedem Commit grün sein.
- Inhalte (`content/*.json`) nur über den Skill `/neue-woerter` oder mit anschließendem `npm run check-content` ändern.
