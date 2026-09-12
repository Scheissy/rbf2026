const { loadApp, createChecker } = require('./test-helpers');

function activeDays(d) {
  return [...d.querySelectorAll('.day-btn')].filter(b => b.classList.contains('active')).map(b => b.dataset.day);
}

(async () => {
  const t = createChecker();

  // ── Test 1: Erster Besuch des Programm-Tabs MITTEN im Festival (Fr 18.09,
  // 14 Uhr) - applySmartProgDefaults() soll greifen, BEVOR der Nutzer
  // irgendetwas manuell angefasst hat. ──────────────────────────────────────
  {
    const { window: w, document: d } = await loadApp();
    w.getBerlinNow = () => ({ year: 2026, month: 9, day: 18, hour: 14, minute: 0 });

    w.switchTab('programm');
    const days = activeDays(d);
    const time = d.getElementById('timeFrom').value;

    // Vereinheitlicht mit resetProgFilters(): "heute + alle kommenden Tage"
    // (vergangene Tage weg), nur die Zeit bleibt bewusst "smart" (aktuelle
    // Uhrzeit statt 08:00), damit der erste Blick zeigt, was gerade läuft.
    t.check('Erster Programm-Besuch am Fr 18.09, 14 Uhr -> Fr+Sa aktiv (Mi/Do als vergangen weg), Zeit 13:00.',
      JSON.stringify(days) === JSON.stringify(['Fr 18.09', 'Sa 19.09']) && time === '13:00', { days, time });
  }

  // ── Test 2: Smart-Defaults greifen nur EINMAL - manuelle Änderungen danach
  // dürfen nicht durch einen erneuten Tab-Wechsel überschrieben werden. ─────
  {
    const { window: w, document: d } = await loadApp();
    w.getBerlinNow = () => ({ year: 2026, month: 9, day: 18, hour: 14, minute: 0 });

    w.switchTab('programm'); // 1. Besuch -> Smart-Default greift (Fr 18.09, 13:00)
    // Nutzer ändert manuell auf Samstag:
    d.querySelectorAll('.day-btn').forEach(b => b.classList.toggle('active', b.dataset.day === 'Sa 19.09'));
    w.switchTab('kuenstler');
    w.switchTab('programm'); // 2. Besuch -> darf die manuelle Wahl NICHT überschreiben

    const days = activeDays(d);
    t.check('Manuelle Tag-Auswahl bleibt nach erneutem Tab-Wechsel erhalten (Smart-Default greift nur beim allerersten Mal).',
      JSON.stringify(days) === JSON.stringify(['Sa 19.09']), days);
  }

  // ── Test 3: Erster Besuch des Programm-Tabs VOR Festivalbeginn - Smart-
  // Defaults dürfen NICHT eingreifen (kein "heute" im Festivalzeitraum). ────
  {
    const { window: w, document: d } = await loadApp();
    w.getBerlinNow = () => ({ year: 2026, month: 9, day: 1, hour: 12, minute: 0 });

    w.switchTab('programm');
    const days = activeDays(d);
    t.check('Vor Festivalbeginn bleiben beim ersten Besuch alle Tage aktiv (kein ungewollter Eingriff).',
      JSON.stringify(days) === JSON.stringify(['Mi 16.09', 'Do 17.09', 'Fr 18.09', 'Sa 19.09']), days);
  }

  // ── Test 4: Nachteulen-Puffer wirkt auch beim allerersten Tab-Wechsel -
  // 2 Uhr nachts am Kalendertag 18.09 zählt noch als Donnerstag. ────────────
  {
    const { window: w, document: d } = await loadApp();
    w.getBerlinNow = () => ({ year: 2026, month: 9, day: 18, hour: 2, minute: 0 });

    w.switchTab('programm');
    const days = activeDays(d);
    t.check('Erster Besuch um 2 Uhr nachts (Kalendertag 18.09) -> Smart-Default wählt korrekt noch Do+Fr+Sa (Mi weg).',
      JSON.stringify(days) === JSON.stringify(['Do 17.09', 'Fr 18.09', 'Sa 19.09']), days);
  }

  // ── Test 5: Kompletter Ablauf am letzten Festivaltag (Samstag) - Reset
  // während des allerletzten Tages soll auf genau diesen einen Tag reduzieren,
  // nicht auf einen leeren oder falschen Zustand. ───────────────────────────
  {
    const { window: w, document: d } = await loadApp();
    w.getBerlinNow = () => ({ year: 2026, month: 9, day: 19, hour: 20, minute: 0 });

    w.switchTab('programm');
    w.resetProgFilters();
    const days = activeDays(d);
    const timeFrom = d.getElementById('timeFrom').value;
    t.check('Reset am letzten Festivaltag (Sa, 20 Uhr) -> nur Sa 19.09 aktiv, Zeit ab 08:00.',
      JSON.stringify(days) === JSON.stringify(['Sa 19.09']) && timeFrom === '08:00', { days, timeFrom });
  }

  t.finish();
})();
