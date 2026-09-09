# Testübersicht (RBF2026 App)

Alle Tests laufen gegen `index.html` (App-Logik) mit der Testdatendatei
`rbf-data.test.js` (keine echten Künstlerdaten). Ausführung: `./run-tests.sh`
für alle, `./run-tests.sh <name>` für einzelne (z.B. `./run-tests.sh
gender_abbreviation`).

Neue Testdateien: bitte hier eine Zeile ergänzen, sonst verliert die Liste
mit der Zeit ihren Nutzen.

| Datei | Prüft |
|---|---|
| `test_e2e_smoke.js` | End-to-End-Rauchtest: kompletter Ablauf über beide Tabs (bewerten, gesehen markieren, reinhören, ausblenden, Event ausblenden, Jetzt, Reset, Locations verwalten, Tab-Wechsel, Speicher-Zyklus) - keine Schritt darf einen JS-Fehler werfen. |
| `test_festival_period.js` | Verhalten *während* der eigentlichen Festivaltage (nicht am heutigen Real-Datum): Smart-Defaults beim ersten Programm-Besuch, Nachteulen-Puffer, Verhalten vor Festivalbeginn. |
| `test_filters_collapse.js` | Ein-/Ausklappen des "Weitere Filter"-Bereichs in der Programm-Übersicht; Persistenz des Auf-/Zu-Zustands. |
| `test_hidden_events.js` | Ausblenden einzelner Sonderveranstaltungen (🙈), inkl. Regressionscheck der Event-URL-Verlinkung. |
| `test_jump_info_modal.js` | ⓘ-Erklärungs-Modal für den zweistufigen "Jetzt"-Button. |
| `test_jump_to_now.js` | Zweistufiges "Jetzt"-Verhalten: 1. Klick nur Zeit, 2. Klick zusätzlich Reset der übrigen Filter. |
| `test_loc_info_modal.js` | ⓘ-Erklärungs-Modal beim Location-Filter (Hinweis auf "Locations verwalten" + Anzeige der aktuell ausgewählten Locations). |
| `test_prog_filters_indicator.js` | Aktiv-Punkt am "Weitere Filter"-Button (erscheint nur bei eingeklapptem Panel + aktivem "versteckten" Filter, Event-Checkboxen bewusst ausgenommen). |
| `test_prog_genre_filter.js` | Genre-Mehrfachfilter in der Programm-Übersicht (UI, Filterwirkung, Persistenz, Zurücksetzen, Unabhängigkeit vom Künstler-Tab). |
| `test_rating_badge_move.js` | Bewertungs-Badge (5-Sterne, feste Breite) in `prog-right-col`, Plan-Flag-Button neben der Zeit. |
| `test_rbf_events_toggle.js` | Globaler Settings-Schalter "RBF-Sonderveranstaltungen" (an/aus wirkt auf Events + die beiden Event-Checkboxen). |
| `test_reset_past_days.js` | "Filter zurücksetzen" blendet vergangene Festivaltage aus (Mi/Do/Fr/Sa-Fälle, Nachteulen-Puffer, vor/nach dem Festival). |
| `test_reset_time_independence.js` | "Filter zurücksetzen" liefert am selben Tag unabhängig von der Uhrzeit immer denselben Zustand. |
| `test_special_char_rating_bug.js` | Regressionstest für den Escaping-Bug bei Künstlernamen mit Apostroph (Bewertung + "Gesehen" in der Programm-Übersicht). |
| `test_country_abbreviation.js` | `shortenHerkunft()`: Länder-Abkürzungen (inkl. zusammengesetzter Länder mit "/"), nur in der Künstler-, nicht in der Programm-Übersicht. Nutzt eine EIGENE, kleine Testdatendatei (volle Ländernamen) statt `rbf-data.test.js`. |
| `test_gender_abbreviation.js` | `shortenGeschlecht()`: Kollisionsfreie Kurzformen (w/m/d/mix), nur in der Künstler-Übersicht. |

## Hilfsdateien

- `test-helpers.js` - gemeinsame Helfer (`loadApp()`, `reloadWithState()`,
  `createChecker()`). Bisher nicht von den Dateien oben genutzt (die haben
  ihr JSDOM-Setup jeweils noch selbst eingebaut) - gedacht für eine
  schrittweise Migration, siehe Kommentar am Kopf der Datei.
- `run-tests.sh` - führt alle (oder gezielt einzelne) `test_*.js` aus.
- `rbf-data.test.js` - gemeinsame Testdatendatei, deckt bewusst mehrere
  Sonderfälle ab (siehe Kommentar am Kopf der Datei selbst).
