const { loadApp, reloadWithState, createChecker } = require('./test-helpers');

// Testdaten (rbf-data.test.js), nid -> Tag / Location:
//  1 Nova Frequenz Mi Docks | 2 Stahl & Beton Mi Molotow | 3 Kollektiv Nachtfalter Do Prinzenbar
//  4 Rosa Mercur Do Docks   | 5 Rosa Mercur Fr (TBA, ohne Location) | 6 Blau Neon Fr Molotow
//  10 Nordlicht Prozession Sa Docks | 11 DJ Mitternacht Sa Molotow
//  Events: evt-0 Anchor Award Show (Musik, Fr, St. Pauli Theater), evt-1 RBF Podcast Live (Sonstiges, Do, Docks)

const block = (d, id) => d.querySelector(`.ausw-block[data-ausw="${id}"]`);
const rows = (d, id) => [...block(d, id).querySelectorAll('.ausw-loc')].map(r => ({
  name: r.querySelector('.ausw-loc-head > span:first-child').textContent,
  count: parseInt(r.querySelector('.ausw-loc-count').textContent, 10),
  width: r.querySelector('.ausw-bar-fill').style.width
}));
// Die ersten drei Kennzahlen (Anzahl, Zeit, Ø); die 4. (Strecke) prüft test_walk_distance.js.
const kpis = (d, id) => [...block(d, id).querySelectorAll('.ausw-kpi')].slice(0, 3).map(k => k.querySelector('.ausw-kpi-val').textContent);
const summary = (d, id) => rows(d, id).map(r => `${r.name}:${r.count}`).join(', ');

(async () => {
  const { window: w, document: d, errors } = await loadApp({ trackErrors: true });
  const t = createChecker();

  const open = () => { w.switchTab('kuenstler'); w.switchTab('auswertung'); };

  // ── 1) Tab in der Bottom-Nav ─────────────────────────────────────────────
  const navIds = [...d.querySelectorAll('.bottomnav .nav-btn')].map(b => b.id);
  t.check('Bottom-Nav hat 4 Tabs in der Reihenfolge Künstler, Programm, Auswertung, Settings.',
    JSON.stringify(navIds) === JSON.stringify(['nav-kuenstler', 'nav-programm', 'nav-auswertung', 'nav-io']), navIds);

  w.switchTab('auswertung');
  const visibleViews = ['kuenstler', 'programm', 'auswertung', 'io'].filter(v => !d.getElementById(`view-${v}`).classList.contains('hidden'));
  t.check('Auswertung-Tab zeigt nur seine eigene View an.', JSON.stringify(visibleViews) === JSON.stringify(['auswertung']), visibleViews);
  t.check('Nav-Button "Auswertung" ist als aktiv markiert, die anderen nicht.',
    d.getElementById('nav-auswertung').classList.contains('active') &&
    !d.getElementById('nav-kuenstler').classList.contains('active') &&
    !d.getElementById('nav-io').classList.contains('active'));

  // ── 2) Aufbau: immer Gesamt + alle vier Tage ────────────────────────────
  const blockIds = [...d.querySelectorAll('.ausw-block')].map(b => b.getAttribute('data-ausw'));
  t.check('Es gibt immer einen Gesamt-Block plus je einen Block pro Festivaltag (Reihenfolge chronologisch).',
    JSON.stringify(blockIds) === JSON.stringify(['gesamt', 'Mi 16.09', 'Do 17.09', 'Fr 18.09', 'Sa 19.09']), blockIds);
  t.check('Ohne Eintragungen zeigen alle Blöcke "Noch keine besuchten Auftritte.".',
    [...d.querySelectorAll('.ausw-block')].every(b => b.textContent.includes('Noch keine besuchten Auftritte')));

  // ── 3) Definition "besucht": Dauer ODER Bewertung ───────────────────────
  w.setShowDuration('x', 'nid:1', '45');   // nur Dauer            (Mi, Docks)
  w.setShowRating('x', 'nid:2', 4);        // nur Bewertung        (Mi, Molotow)
  w.togglePlanFlag('x', 'nid:3');          // nur Ziel-Flag        -> zählt NICHT
  w.setSeen('Kollektiv Nachtfalter', 'ja'); // Künstler "gesehen"  -> zählt NICHT (Auftritts-Ebene!)
  w.setShowDuration('x', 'nid:4', '60');   // Dauer UND Bewertung  (Do, Docks) -> zählt EINMAL
  w.setShowRating('x', 'nid:4', 5);
  w.setShowRating('x', 'nid:5', 3);        // TBA ohne Location    (Fr)
  w.setShowRating('x', 'nid:6', 2);        //                      (Fr, Molotow)
  w.setShowDuration('x', 'nid:11', '30');  //                      (Sa, Molotow)
  open();

  t.check('Gesamt: besuchte Auftritte = Dauer ODER Bewertung (6); Ziel-Flag und Künstler-"gesehen" zählen nicht; Dauer+Bewertung zählt nur einmal.',
    kpis(d, 'gesamt')[0] === '6', kpis(d, 'gesamt'));
  t.check('Gesamt: Zeit vor Ort = Summe der Dauern (45+60+30 = 2h 15min).', kpis(d, 'gesamt')[1] === '2h 15min', kpis(d, 'gesamt'));
  t.check('Gesamt: Ø Bewertung nur über bewertete Auftritte ((4+5+3+2)/4 = 3.5).', kpis(d, 'gesamt')[2] === '3.5', kpis(d, 'gesamt'));

  // ── 4) Location-Ranking ────────────────────────────────────────────────
  t.check('Gesamt-Ranking nach Häufigkeit absteigend, Auftritte ohne Location als "Ohne Location".',
    summary(d, 'gesamt') === 'Molotow:3, Docks:2, Ohne Location:1', summary(d, 'gesamt'));
  t.check('Balken sind relativ zur häufigsten Location (100 % / 67 % / 33 %).',
    JSON.stringify(rows(d, 'gesamt').map(r => r.width)) === JSON.stringify(['100%', '67%', '33%']), rows(d, 'gesamt').map(r => r.width));

  // ── 5) Aufschlüsselung nach Tagen ───────────────────────────────────────
  t.check('Mi: Docks 1, Molotow 1 (bei Gleichstand alphabetisch).', summary(d, 'Mi 16.09') === 'Docks:1, Molotow:1', summary(d, 'Mi 16.09'));
  t.check('Do: nur Docks 1 - Prinzenbar (nur Ziel-Flag) taucht nicht auf.', summary(d, 'Do 17.09') === 'Docks:1', summary(d, 'Do 17.09'));
  t.check('Fr: Molotow 1, Ohne Location 1.', summary(d, 'Fr 18.09') === 'Molotow:1, Ohne Location:1', summary(d, 'Fr 18.09'));
  t.check('Sa: nur Molotow 1 (Docks-Auftritt ohne Eintrag zählt nicht).', summary(d, 'Sa 19.09') === 'Molotow:1', summary(d, 'Sa 19.09'));
  t.check('Tages-Kennzahlen: Do = 1 Auftritt, 1h, Ø 5.0; Sa ohne Bewertung zeigt "–" beim Ø.',
    JSON.stringify(kpis(d, 'Do 17.09')) === JSON.stringify(['1', '1h', '5.0']) &&
    JSON.stringify(kpis(d, 'Sa 19.09')) === JSON.stringify(['1', '30 Min', '–']), { do: kpis(d, 'Do 17.09'), sa: kpis(d, 'Sa 19.09') });

  // ── 6) Sonderveranstaltungen ────────────────────────────────────────────
  w.setShowRating('x', 'nid:evt-1', 4); // RBF Podcast Live (Do, Docks)
  open();
  t.check('Ein bewertetes Event zählt wie ein Auftritt (Docks Gesamt 3, Do: 2 besucht).',
    summary(d, 'gesamt') === 'Docks:3, Molotow:3, Ohne Location:1' && kpis(d, 'Do 17.09')[0] === '2', summary(d, 'gesamt'));

  w.toggleSetting('showMusicEvents', false);
  w.setShowRating('x', 'nid:evt-0', 5); // Anchor Award Show (Musik, Fr, St. Pauli Theater)
  open();
  t.check('Die Kategorie-Checkboxen der Programm-Übersicht beeinflussen die Auswertung nicht (Musik-Event bleibt drin).',
    summary(d, 'Fr 18.09').includes('St. Pauli Theater:1'), summary(d, 'Fr 18.09'));
  w.toggleSetting('showMusicEvents', true);

  w.toggleSetting('showRbfEvents', false);
  open();
  t.check('Globaler Schalter "RBF-Sonderveranstaltungen" aus -> Events verschwinden aus der Auswertung.',
    summary(d, 'gesamt') === 'Molotow:3, Docks:2, Ohne Location:1' && !d.getElementById('auswertungContent').textContent.includes('St. Pauli Theater'), summary(d, 'gesamt'));
  w.toggleSetting('showRbfEvents', true);

  // ── 7) Unabhängig von Filtern / Ausblenden ─────────────────────────────
  w.toggleLocVisibility('Docks');       // Location dauerhaft aus der Programm-Übersicht ausgeblendet
  w.toggleHidden('Nova Frequenz');      // Künstler ausgeblendet
  open();
  t.check('Dauerhaft ausgeblendete Locations und ausgeblendete Künstler verfälschen die Auswertung nicht.',
    summary(d, 'Mi 16.09') === 'Docks:1, Molotow:1', summary(d, 'Mi 16.09'));
  w.resetLocManage();
  w.toggleHidden('Nova Frequenz');

  // ── 8) Live-Aktualisierung beim Tab-Wechsel ────────────────────────────
  w.setShowRating('x', 'nid:5', 3); // Bewertung wieder entfernt (gleicher Wert = zurücksetzen)
  open();
  t.check('Änderungen in anderen Tabs sind beim nächsten Öffnen der Auswertung sichtbar (Fr: "Ohne Location" weg).',
    !summary(d, 'Fr 18.09').includes('Ohne Location'), summary(d, 'Fr 18.09'));
  w.setShowRating('x', 'nid:5', 3);

  // ── 9) Sonderzeichen im Location-Namen ──────────────────────────────
  w.setShowRating('x', 'nid:7', 4); // Grauzone Sieben, "Uebel & Gefährlich"
  open();
  const names = [...block(d, 'Fr 18.09').querySelectorAll('.ausw-loc-head > span:first-child')].map(e => e.textContent);
  t.check('Location mit "&" wird korrekt (escaped) dargestellt.', names.includes('Uebel & Gefährlich'), names);

  // ── 10) Persistenz: nach echtem Neustart identische Auswertung ─────────
  w.saveToStorage();
  const before = summary(d, 'gesamt');
  const reloaded = await reloadWithState(w, ['rbf2026_v1']);
  reloaded.window.switchTab('auswertung');
  t.check('Nach einem simulierten Neustart liefert die Auswertung dasselbe Ergebnis.',
    summary(reloaded.document, 'gesamt') === before, { vorher: before, nachher: summary(reloaded.document, 'gesamt') });

  t.check('Keine JS-Fehler während des gesamten Ablaufs.', errors.length === 0, errors);
  t.finish();
})();
