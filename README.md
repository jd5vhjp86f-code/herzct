# Herz-CT – Unterseite für radiologie-dammtor.de

Statischer Prototyp (HTML/CSS/Vanilla-JS) der neuen Unterseite zur CT-Koronarangiographie (Herz-CT), aufgebaut wie die Unterseite Lungenkrebsscreening (Repository `ldct`) und vorgesehen zur Übergabe an die Theme-Agentur (OctoberCMS, Theme `ohjunge`).

> **Status:** Prototyp, **nicht zur Veröffentlichung freigegeben.** Orange markierte Stellen („PRÜFEN“) warten auf fachliche Freigabe bzw. Praxisangaben, siehe [`docs/PRUEFEN.md`](docs/PRUEFEN.md).

## Seiten

Online: **https://herz.rosenbaum.hamburg/** (Prototyp, `noindex`). Im Prototyp liegen die Seiten im Wurzelpfad, im Theme später unter `/herz-ct`.

| Prototyp-URL | Theme-URL | Inhalt |
|---|---|---|
| `/` | `/herz-ct` | Hub: Hero mit Herz-Symbol, Zielgruppen-Weiche, Kurzinfo, Notfallhinweis, Kontakt |
| `/patienten/` | `/herz-ct/patienten` | Zwei Untersuchungen (CCTA, Kalk-Score), Voraussetzungen GKV/PKV, **Vorbereitungs-Check**, Ablauf, Nutzen/Risiken, FAQ |
| `/zuweiser/` | `/herz-ct/zuweiser` | Indikation nach MVV-RL Anl. I Nr. 42, **VTW-Rechner** (Marburger Herz-Score / NVL Tabelle 6) mit Textbaustein für die Überweisung, druckbare Checkliste, Ablauf, Befundinhalte, EBM 34370/34371, Quellen |
| `/prototyp/` | entfällt | Prototyp-Übersicht, Teaser für Startseite und `/ct-diagnostik`, Leitbild-Varianten |

## Design

- **Farben** aus dem Live-Theme (`/themes/ohjunge/assets/dist/css/style.css`, abgerufen 05.10.2026): Blau `#007aa8`, CT-Petrol `#008b92`, Salbei `#46aa9b`, Hellblau `#68b1d4`, Taupe `#7c6e65`/`#5d534c`, Sand `#eceae5`. Dazu Rot `#e2574c` aus dem Herz-Symbol. Alle Werte in `assets/css/tokens.css`.
- **Schrift:** Das Theme lädt `urw-din` über Adobe Fonts. Im Prototyp wird sie nicht nachgeladen (Kit an die Praxis-Domain gebunden); im Theme greift sie automatisch.
- **Logo/Leitbild:** das gelieferte Herz-Symbol (`assets/img/herz-symbol-*`), als Inline-SVG in drei Varianten (`heart-hero`, `heart-small`, `heart-mono`). Ringe pulsieren langsam, nur bei `prefers-reduced-motion: no-preference`.
- Komponenten, Typografie und Barrierefreiheits-Regeln entsprechen der Lungenkrebsscreening-Seite (Präfix `hct-` statt `lks-`).

## Prototyp ansehen

```bash
python3 -m http.server 8080 -d public   # dann http://localhost:8080 öffnen
```

**Online:** https://herz.rosenbaum.hamburg/ (GitHub Pages mit eigener Domain). Einrichtung einmalig:

1. *Settings → General → Default branch:* `main`
2. *Settings → Pages → Build and deployment → Source:* „GitHub Actions“
3. *Settings → Pages → Custom domain:* `herz.rosenbaum.hamburg` eintragen, nach erfolgreicher DNS-Prüfung „Enforce HTTPS“ aktivieren
4. DNS (IONOS): `herz` als CNAME auf `jd5vhjp86f-code.github.io`

Stand 05.10.2026: Schritte 1–3 erledigt, DNS-Eintrag (4) und „Enforce HTTPS“ stehen noch aus.

Der Workflow `Prototyp` veröffentlicht danach jeden Push auf `main`; manuell über *Actions → Prototyp → Run workflow*. Ein Re-Run eines älteren Laufs genügt nicht, weil er den damaligen Event-Stand (`has_pages`) verwendet. `public/CNAME` wird vom Build erzeugt; bei Veröffentlichung über GitHub Actions ist aber die Einstellung unter *Custom domain* maßgeblich.

> Eine Pages-Seite ist öffentlich erreichbar. Der Prototyp ist per `noindex` und `robots.txt` gesperrt, enthält aber noch nicht freigegebene medizinische Inhalte. Link nur gezielt weitergeben.

## Entwicklung

```bash
npm test                        # Unit-Tests der VTW-Logik (node --test)
node tools/build.mjs            # src/ + assets/ → public/
node tools/build.mjs --agentur  # Produktionsfassung nach dist/agentur/herz-ct/ (ohne Prototyp-Rahmen, Links unter /herz-ct, Assets unter /themes/ohjunge/assets/hct/)
node tools/contrast.mjs         # WCAG-Kontraste der Tokens
```

`public/` ist das Build-Ergebnis und wird eingecheckt.

## Aufbau

```
assets/css/tokens.css      Design-Tokens (--hct-*)
assets/css/hct.css         Komponenten (Präfix hct-)
assets/js/vtw.js           VTW-Logik (NVL Tabellen 5 und 6, Einordnung nach G-BA/NVL), reine Funktionen
assets/js/vtw-ui.js        Oberfläche VTW-Rechner
assets/js/prep-ui.js       Vorbereitungs-Check (Patienten)
assets/js/print-checklist.js  Druck nur der Checkliste
assets/img/                Herz-Symbol (SVG/PNG), Praxis-Logo
src/partials/, src/pages/  Bausteine und Seiten (Include-Syntax wie im ldct-Projekt)
docs/                      Freigabeliste, Recherche/Quellen
```

Integration ins Theme: wie in `ldct/docs/UEBERGABE.md` beschrieben (Pages `herz-ct.htm`, `herz-ct/patienten.htm`, `herz-ct/zuweiser.htm`; Partials nach `partials/hct/`).
