// ── test-helpers.js ─────────────────────────────────────────────────────────
// Gemeinsame Hilfsfunktionen für die Testdateien in diesem Verzeichnis.
//
// Ziel: das in allen bisherigen test_*.js-Dateien praktisch identisch
// kopierte JSDOM-Setup (fs.readFileSync, VirtualConsole, JSDOM-Konstruktion,
// Warte-Timeout - ca. 20 Zeilen pro Datei) an einer einzigen Stelle pflegen.
//
// Schritt 1 (diese Datei): komplett eigenständig - keine bestehende
// Testdatei wurde angefasst, alle 16 laufen unverändert weiter genau wie
// vorher, unabhängig davon, ob diese Helper existieren.
// Schritt 2 (später, optional, separat zu entscheiden): bestehende
// Testdateien nach und nach hierauf umstellen, um die Duplikation
// tatsächlich zu entfernen. Diese Datei ist bewusst so geschnitten, dass
// eine einzelne Datei-Migration klein und risikoarm bleibt (Boilerplate
// raus, Prüf-Logik unangetastet).

const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const INDEX_HTML_PATH = path.join(__dirname, 'index.html');
const DEFAULT_DATA_PATH = path.join(__dirname, 'rbf-data.test.js');
const DEFAULT_INIT_DELAY_MS = 300;

/**
 * Lädt index.html + eine Testdatendatei (Standard: rbf-data.test.js) in ein
 * frisches JSDOM und wartet, bis die App fertig initialisiert ist.
 *
 * @param {object} [opts]
 * @param {string} [opts.dataScript]   - Eigener Testdaten-Code als String,
 *     ersetzt den Inhalt von rbf-data.test.js. Für Szenarien, die andere
 *     Fixture-Daten brauchen (z.B. test_country_abbreviation.js: volle statt
 *     abgekürzte Ländernamen) - identisches Muster wie bisher, nur zentral
 *     verfügbar statt in jeder Datei einzeln nachgebaut.
 * @param {string} [opts.dataPath]     - Alternativer Pfad zu einer
 *     Testdaten-Datei, statt rbf-data.test.js.
 * @param {number} [opts.initDelayMs]  - Wartezeit nach dem Laden (ms).
 * @param {boolean} [opts.trackErrors] - Wenn true, werden window-'error'-
 *     Events in .errors gesammelt (für Rauchtests, die auf "keine
 *     unerwarteten Fehler" prüfen wollen, siehe test_e2e_smoke.js).
 * @returns {Promise<{dom, window, document, errors: string[]}>}
 */
async function loadApp(opts = {}) {
  const html = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
  const dataScript = opts.dataScript !== undefined
    ? opts.dataScript
    : fs.readFileSync(opts.dataPath || DEFAULT_DATA_PATH, 'utf-8');

  const htmlForTest = html.replace(
    /<script src="rbf-data\.js"><\/script>/,
    `<script>${dataScript}</script>`
  );

  const errors = [];
  const vc = new VirtualConsole();
  vc.forwardTo(console);
  vc.on('jsdomError', e => errors.push(`jsdomError: ${e.message}`));

  const dom = new JSDOM(htmlForTest, {
    url: 'https://scheissy.github.io/rbf2026/',
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: vc
  });

  if (opts.trackErrors) {
    dom.window.addEventListener('error', e => errors.push(`window error: ${e.error ? e.error.message : e.message}`));
  }

  await new Promise(resolve => setTimeout(resolve, opts.initDelayMs ?? DEFAULT_INIT_DELAY_MS));

  return { dom, window: dom.window, document: dom.window.document, errors };
}

/**
 * Simuliert einen echten App-Neustart: lädt eine ZWEITE, frische App-Instanz,
 * überträgt den localStorage-Stand einer bestehenden Instanz dorthin und
 * stößt den Ladevorgang (loadFromStorage()/loadFilterState()) manuell an -
 * die App liest localStorage nämlich nur einmal beim Start, das Setzen NACH
 * der Konstruktion würde sonst stillschweigend ignoriert.
 *
 * Wichtig: appSettings, selectedLocs, hiddenEvents, progSelectedGenres & Co.
 * sind top-level `let`-Variablen im Inline-Script und daher (wie in echten
 * Browsern auch) keine window-Properties - sie können also von außen nicht
 * direkt zurückgesetzt/gelesen werden. Genau deshalb der Umweg über eine
 * zweite, komplett frische Instanz statt eines In-Memory-Resets der ersten.
 * Bisher wurde dieses Muster in test_prog_genre_filter.js und
 * test_rbf_events_toggle.js jeweils separat von Hand nachgebaut.
 *
 * @param {Window} sourceWindow  - Die Instanz, aus der der Stand kommt.
 * @param {string[]} storageKeys - z.B. ['rbf2026_v1', 'rbf2026_filters_v1']
 * @param {object} [opts]        - Wie bei loadApp().
 */
async function reloadWithState(sourceWindow, storageKeys, opts = {}) {
  const saved = {};
  for (const key of storageKeys) {
    saved[key] = sourceWindow.localStorage.getItem(key);
  }
  const fresh = await loadApp(opts);
  for (const key of storageKeys) {
    if (saved[key] !== null) fresh.window.localStorage.setItem(key, saved[key]);
  }
  // Die App liest localStorage nur EINMAL beim Start (während der Konstruktion
  // oben in loadApp()) - da wir den gespeicherten Stand erst danach in die
  // frische Instanz schreiben, muss der Ladevorgang hier manuell nachgestoßen
  // werden. Beide Loader sind null-sicher (kein Fehler, wenn der jeweilige Key
  // nicht gesetzt wurde), daher unbedingt beide aufrufen statt selektiv nur
  // den zur übergebenen Key-Liste passenden.
  if (typeof fresh.window.loadFromStorage === 'function') fresh.window.loadFromStorage();
  if (typeof fresh.window.loadFilterState === 'function') fresh.window.loadFilterState();
  // applySettingsUI() synchronisiert die Checkbox-DOM-Elemente (z.B.
  // #settingShowRbfEvents) mit den gerade geladenen appSettings-Werten -
  // ohne diesen Aufruf würden die Checkboxen weiterhin ihren ALTEN
  // (Default-)Zustand von der Konstruktion der frischen Instanz zeigen.
  if (typeof fresh.window.applySettingsUI === 'function') fresh.window.applySettingsUI();
  return fresh;
}

/**
 * Minimaler Check-Helfer für konsistentes Pass/Fail-Tracking über eine ganze
 * Testdatei hinweg - ersetzt das bisherige manuelle Muster (lokale "pass"-
 * Variable + eigenständige console.error/console.log-Paare + finales
 * if/else + process.exit in jeder Datei).
 *
 * Beispiel:
 *   const { loadApp, createChecker } = require('./test-helpers');
 *   (async () => {
 *     const { window: w, document: d } = await loadApp();
 *     const t = createChecker();
 *     t.check('Beschreibung der Erwartung', irgendeineBedingung);
 *     t.check('Noch eine Erwartung', anderesBedingung, { debugInfo: '...' });
 *     t.finish(); // druckt Zusammenfassung + process.exit(0 oder 1)
 *   })();
 */
function createChecker() {
  let pass = true;
  let count = 0;
  return {
    check(description, condition, details) {
      count++;
      if (condition) {
        console.log(`OK: ${description}`);
      } else {
        console.error(`FEHLER: ${description}`, details !== undefined ? details : '');
        pass = false;
      }
      return condition;
    },
    get passed() { return pass; },
    get count() { return count; },
    finish() {
      console.log(pass ? `\n✅ ALLE ${count} PRÜFUNGEN BESTANDEN` : `\n❌ MINDESTENS EINE PRÜFUNG FEHLGESCHLAGEN (von ${count})`);
      process.exit(pass ? 0 : 1);
    }
  };
}

module.exports = { loadApp, reloadWithState, createChecker, INDEX_HTML_PATH, DEFAULT_DATA_PATH };
