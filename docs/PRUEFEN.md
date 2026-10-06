# Freigabeliste

Alle offenen Stellen sind im Prototyp orange gestrichelt mit „PRÜFEN“ markiert (Klasse `hct-pruefen`). Veröffentlichung erst nach fachlicher Freigabe.

| # | Inhalt | Seite | Hinweis |
|---|---|---|---|
| 1 | Kalk-Score als IGeL: wird er angeboten, zu welchem Preis? | Patienten | Nicht GKV-Leistung als alleinige Untersuchung |
| 2 | ~~Laborwerte: Alter~~ | – | ✅ max. 12 Wochen (Laufzettel, 06.10.2026) |
| 3 | ~~Nüchternheit~~ | – | ✅ nicht streng nüchtern, kein schweres Essen unmittelbar vorher, stilles Wasser (Laufzettel) |
| 4 | Koffein/Nikotin: **„am Tag der Untersuchung“** (Hinweis 06.10.2026) oder **„12 Std. vorher“** (alter Laufzettel)? | Patienten, Laufzettel | Vorerst beides kombiniert: „am Tag der Untersuchung, mindestens 12 Stunden vorher“ – bitte bestätigen |
| 5 | ~~Fahrtüchtigkeit, Dauer~~ | – | ✅ Dauer ca. 1,5–2 Stunden; nicht selbst Auto fahren (06.10.2026, freigegeben mit Aufklärungsbogen) |
| 6 | Befundlaufzeit, Übermittlungsweg (KIM/Fax/Post), Patientenkopie/Bildportal | Patienten, Zuweiser | |
| 7 | Kooperationspartner Kardiologie für Fallkonferenz (GOP 34371) | Patienten, Zuweiser | Radiologie + Kardiologie Pflicht |
| 8 | Genehmigung der KV Hamburg nach Strahlendiagnostik-Vereinbarung: Datum, befundende Ärztinnen/Ärzte | Zuweiser | Voraussetzung für GOP 34370 |
| 9 | Befundinhalte: CAD-RADS 2.0, Plaquelast, Kalk-Perzentilen? | Zuweiser | |
| 10 | Telefonnummer für Herz-CT-Termine: 040 3500484-0 (allgemein) oder 040 3500484-54? | alle | Live-Seite nennt -0 für Termine, -54 für Privatpatienten MRT/CT |
| 11 | Doctolib: Besuchsgrund Herz-CT im Profil vorhanden? | alle | Link bestätigt (05.10.2026): `mammadiagnostik-stephansplatz?pid=practice-79031`, wie beim Lungenkrebsscreening |
| 12 | Alle medizinischen Texte: fachliche Endabnahme | alle | |
| 13 | Vorbereitungs-Check: Formulierungen zu Metformin, PDE-5-Hemmern, Betablocker-Kontraindikationen | Patienten | Allgemein gehalten, verweist immer auf das Gespräch |

## Laufzettel und Aufklärung (06.10.2026)

Neu gestaltet nach den Vorlagen der Praxis: `src/docs/*.html` → PDF (`node tools/make-docs.mjs`) in `assets/downloads/`, Word-Fassungen (`node tools/make-docx.cjs`) in `docs/vorlagen/`.

| # | Punkt | Hinweis |
|---|---|---|
| 14 | **Kontaktdaten auf dem alten Laufzettel:** Telefon „040 3500485-0“ und E-Mail „info@mrt-dammtor.de“ | Neu verwendet: 040 3500484-0 und info@radiologie-dammtor.de (wie Briefbogen und Website). Bitte bestätigen. |
| 15 | Laufzettel: „Vom **kardiologischen** Zuweiser auszufüllen“ | Geändert in „Von der überweisenden Praxis“, da auch Hausarztpraxen überweisen dürfen |
| 16 | Laufzettel: neu ergänzte Felder | Name/Geburtsdatum/Termin, **VTW mit Art der Ermittlung** (EBM-Pflicht), Praxisstempel; bei „Bitte mitbringen“ Überweisung/Versichertenkarte und Aufklärungsbogen |
| 17 | Laufzettel: Metoprolol „am CT-Morgen“ vs. „ca. 2 Stunden vor dem Termin“ | Vereinheitlicht auf „ca. 2 Stunden vor dem Termin“ |
| 18 | ✅ **Umgesetzt (06.10.2026):** Abschnitt „Besonderheiten beim Herz-CT“, Fragen zu Herzrhythmus und Potenzmitteln, erweiterte Einwilligung, Unterschrift der aufklärenden Ärztin / des Arztes, Nitrospray im Personalteil. Ursprüngliche Empfehlung: (fachliche/rechtliche Entscheidung): Hinweise zu Betablocker und Nitrospray (Wirkungen, Nebenwirkungen, Fahrtüchtigkeit), zur Strahlenexposition und ein Feld für die Unterschrift der aufklärenden Ärztin / des aufklärenden Arztes (§ 630e BGB: mündliche ärztliche Aufklärung) | Der Bogen beschreibt bisher eine allgemeine CT, nicht die Herz-spezifische Vorbereitung |
| 19 | ✅ Frage nach Infektionskrankheiten (HIV, Hepatitis) gestrichen (06.10.2026) | Für die Untersuchung nicht erforderlich; Hygienemaßnahmen gelten ohnehin für alle |

Korrigierte Schreibfehler des alten Laufzettels: „WOCHEM“, sichtbare Markdown-Sternchen „**…**“.

## Nebenbefunde

- **Live-Website, Fußbereich:** MRT/CT-Telefon „040 3500485-0“, sonst überall „040 3500484-0“ – vermutlich Zahlendreher (bereits in `ldct/docs/PRUEFEN.md` vermerkt, am 05.10.2026 weiterhin vorhanden).
- **Live-Website, CT-Seite:** „Meist ist nur ein kurzes Nüchternbleiben erforderlich“ und „Befund rasch“ – sollte nach Freigabe mit den Angaben dieser Unterseite übereinstimmen.

## Entschieden

- **Strahlendosis (05.10.2026):** vorerst die Werte der NVL Chronische KHK 7.0, Tabelle 7 (CCTA meist < 5 mSv, in bestimmten Fällen ca. 1 mSv; natürliche Jahresdosis ca. 2,5 mSv). Bei Gelegenheit durch typische Werte des eigenen Geräts ersetzen.
