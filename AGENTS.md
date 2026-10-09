# Lese-App (privates Projekt)

Lern-App für Leseanfänger (Erstklässler). Konzept: `docs/superpowers/specs/2026-10-08-lese-app-design.md`.

## Wichtig: privates Projekt

- **Nichts zu Firmen-Servern pushen**, dort keinen Remote anlegen, keine Issues/PRs erstellen. Dieses Projekt hat keinerlei Bezug zu einem Arbeitgeber.
- Gepusht wird ausschließlich `main` nach `origin` (privates Repo, siehe unten). Weitere Remotes oder Branches nur, wenn der Nutzer das ausdrücklich verlangt.
- Keine Firmen-Tools, -Skills oder -Zugänge in diesem Projekt verwenden.

## GitHub-Konto und Identität

- Einziges erlaubtes Konto: das private GitHub-Konto **EfSoonup** auf github.com. Niemals GitHub-Enterprise- oder andere Firmen-Hosts.
- Remote-URL ausschließlich über den SSH-Alias `github-privat`: `git@github-privat:EfSoonup/lese-app.git` (Key `~/.ssh/id_ed25519_github_privat`, siehe `~/.ssh/config`).
- Commit-Identität: `EfSoonup <190464499+EfSoonup@users.noreply.github.com>`. Sie kommt automatisch aus `~/.gitconfig-private` (per `includeIf "gitdir:~/repos/private/"`). Keine Firmen-Mail in Commits; im Zweifel `git config user.email` prüfen.
- Der globale Firmen-`pre-push`-Hook ist hier per `core.hooksPath = .git/hooks` abgeschaltet.

## Sprache

- Konzept, UI-Texte und Inhalte: Deutsch.
- Commit-Messages: Englisch.

## Befehle

- `npm test`, `npm run typecheck`, `npm run check-content` – alle drei müssen vor jedem Commit grün sein.
- Inhalte (`content/*.json`) nur über den Skill `/neue-woerter` oder mit anschließendem `npm run check-content` ändern.
