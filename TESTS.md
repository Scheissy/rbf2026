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
| `test_jump_to_now.js` | Zweistufiges "Jetzt"-Verhalten: 1. Klick nur Zeit+Tage (heute + kommende), 2. Klick zusätzlich Reset der übrigen Filter. |
| `test_jump_to_now_future_scroll.js` | "Jetzt" lässt freies Scrollen in die Zukunft zu: keine Endzeit gesetzt, künftige Tage bleiben aktiv (nicht nur der heutige Tag). |
| `test_loc_info_modal.js` | ⓘ-Erklärungs-Modal beim Location-Filter (Hinweis auf "Locations verwalten" + Anzeige der aktuell ausgewählten Locations). |
| `test_prog_filters_indicator.js` | Aktiv-Punkt am "Weitere Filter"-Button (erscheint nur bei eingeklapptem Panel + aktivem "versteckten" Filter, Event-Checkboxen bewusst ausgenommen). |
| `test_prog_genre_filter.js` | Genre-Mehrfachfilter in der Programm-Übersicht (UI, Filterwirkung, Persistenz, Zurücksetzen, Unabhängigkeit vom Künstler-Tab). |
| `test_rating_badge_move.js` | Bewertungs-Badge (5-Sterne, feste Breite) in `prog-right-col`, Plan-Flag-Button neben der Zeit. |
| `test_rbf_events_toggle.js` | Globaler Settings-Schalter "RBF-Sonderveranstaltungen" (an/aus wirkt auf Events + die beiden Event-Checkboxen). |
| `test_reset_past_days.js` | "Filter zurücksetzen" blendet vergangene Festivaltage aus (Mi/Do/Fr/Sa-Fälle, Nachteulen-Puffer, vor/nach dem Festival). |
| `test_reset_time_independence.js` | "Filter zurücksetzen" liefert am selben Tag unabhängig von der Uhrzeit immer denselben Zustand. |
| `test_special_char_rating_bug.js` | Regressionstest für den Escaping-Bug bei Künstlernamen mit Apostroph (Bewertung + "Gesehen" in der Programm-Übersicht). |
| `test_rename_rescue.js` | Case-insensitive Rettung von Bewertung/Gesehen-Status bei reiner Schreibweisen-Änderung eines Künstlernamens (z.B. "Meller" -> "MELLER"), inkl. Sicherheits-Bremse bei Mehrdeutigkeit. |
| `test_kuenstler_scroll_anchor.js` | Anker-basierte Scroll-Erhaltung in der Künstler-Übersicht bei Filteränderungen: Scroll bleibt auf dem vorher sichtbaren Künstler ausgerichtet (auch wenn sich die Ergebnismenge ändert), fällt auf scrollTop=0 zurück, wenn dieser Künstler rausgefiltert wird. |
| `test_scroll_container_css.js` | Regressions-Schutz für `min-height: 0` auf `#artistList`/`.prog-list` (verschachtelte Flexbox-Scroll-Falle, s. Prompt-Datei) - reiner CSS-Text-Check, kein Layout-Test (jsdom berechnet kein echtes Flexbox-Layout). |
| `test_country_abbreviation.js` | `shortenHerkunft()`: Länder-Abkürzungen (inkl. zusammengesetzter Länder mit "/"), nur in der Künstler-, nicht in der Programm-Übersicht. Nutzt eine EIGENE, kleine Testdatendatei (volle Ländernamen) statt `rbf-data.test.js`. |
| `test_gender_abbreviation.js` | `shortenGeschlecht()`: Kollisionsfreie Kurzformen (w/m/d/mix), nur in der Künstler-Übersicht. |
| `test_auswertung.js` | Auswertung-Tab (4. Bottom-Nav-Tab): Gesamt + Tages-Blöcke, Definition "besucht" (Dauer ODER Auftritts-Bewertung; Ziel-Flag/Künstler-"gesehen" zählen nicht), Location-Ranking + Balken, Kennzahlen (Anzahl/Zeit/Ø), Events (inkl. globalem Schalter), Unabhängigkeit von Filtern/Ausblenden, Live-Update, Persistenz. |
| `test_preview_build.js` | Preview-Build (`build-preview.py`): `preview.html` entsteht aus `index.html` + Testdaten, läuft fehlerfrei, nutzt `__previewStorage` statt `localStorage` und enthält dieselben Features (4 Tabs) wie die App. |
| `test_walk_distance.js` | Wegstrecke im Auswertung-Tab: Kette der besuchten Auftritte je Tag (Zeiten nach Mitternacht korrekt sortiert, Wege nie über Tagesgrenzen), Haversine gegen unabhängige Referenz, Fußweg-Matrix vs. Luftlinie-Fallback vs. gemischt (Kennzeichnung), Alias-Locations, Auftritte ohne Koordinaten/Uhrzeit (Hinweis), Quellenangabe. Nutzt eigene Testdaten + `walkScript`. |
| `test_walk_matrix_script.js` | `build-walk-matrix.js` gegen einen simulierten OSRM-Server (kein Netz): eine Table-Anfrage, Punkt-Deduplizierung, Dateiformat + Kompatibilität mit der App, Fehlerfälle (falscher Code, HTTP 429, fehlende Routen, Auto-Profil/asymmetrisch, unmögliche Wege, >100 Punkte), `--force`, Fallback ohne globales `fetch` (Node < 18) gegen lokalen HTTP-Server, verständliche Meldungen bei Verbindungsfehlern (DNS, Zertifikat, Timeout, Abbruch). |
| `test_sw_assets.js` | Service Worker: `rbf-walk.js` in ASSETS, Network-First wie `rbf-data.js`, Cache-Name hochgezählt. |

## Hilfsdateien

- `test-helpers.js` - gemeinsame Helfer (`loadApp()` inkl. Option `walkScript`, `reloadWithState()`,
  `createChecker()`). Alle 25 Testdateien oben nutzen diese Helfer bereits
  (Migration in 8 Runden abgeschlossen) - Boilerplate wurde dabei um
  durchschnittlich ca. 43 % pro Datei reduziert, die eigentliche Prüf-Logik
  blieb inhaltlich unverändert.
- `build-walk-matrix.js` - erzeugt einmalig lokal `rbf-walk.js` (Fußweg-Matrix aus `VENUE_LOCATIONS`, ein Aufruf des OSRM-Table-Service). Aufruf: `node build-walk-matrix.js` (Optionen im Skriptkopf). Nach Änderungen an Locations/Koordinaten erneut ausführen. Ohne `rbf-walk.js` rechnet die App mit Luftlinie.
- `build-preview.py` - baut `preview.html` (Chat-Preview) aus `index.html` + `rbf-data.test.js`. Aufruf: `python3 build-preview.py`.
- `run-tests.sh` - führt alle (oder gezielt einzelne) `test_*.js` aus.
- `rbf-data.test.js` - gemeinsame Testdatendatei, deckt bewusst mehrere
  Sonderfälle ab (siehe Kommentar am Kopf der Datei selbst).
