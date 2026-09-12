const { loadApp, createChecker } = require('./test-helpers');

function activeDays(d) {
  return [...d.querySelectorAll('.day-btn')].filter(b => b.classList.contains('active')).map(b => b.dataset.day);
}

(async () => {
  const { window: w, document: d } = await loadApp();
  const t = createChecker();

  function check(label, mockNow, expectedDays) {
    w.getBerlinNow = () => mockNow;
    w.resetProgFilters();
    const got = activeDays(d);
    t.check(`${label} -> ${JSON.stringify(got)}`, JSON.stringify(got) === JSON.stringify(expectedDays), { erwartet: expectedDays, erhalten: got });
  }

  // Mittwoch (erster Festivaltag) - kein Tag ist "davor", also alle aktiv.
  check('Reset am Mi 16.09, 12 Uhr', { year: 2026, month: 9, day: 16, hour: 12, minute: 0 },
    ['Mi 16.09', 'Do 17.09', 'Fr 18.09', 'Sa 19.09']);

  // Donnerstag - Mittwoch ist vorbei.
  check('Reset am Do 17.09, 12 Uhr', { year: 2026, month: 9, day: 17, hour: 12, minute: 0 },
    ['Do 17.09', 'Fr 18.09', 'Sa 19.09']);

  // Freitag (das konkrete Beispiel aus der Anfrage) - Mi+Do sind vorbei.
  check('Reset am Fr 18.09, 12 Uhr', { year: 2026, month: 9, day: 18, hour: 12, minute: 0 },
    ['Fr 18.09', 'Sa 19.09']);

  // Samstag (letzter Tag) - nur noch Samstag übrig.
  check('Reset am Sa 19.09, 12 Uhr', { year: 2026, month: 9, day: 19, hour: 12, minute: 0 },
    ['Sa 19.09']);

  // Nachteulen-Puffer: 2 Uhr nachts am 18.09 (Kalendertag Freitag) zählt
  // wegen des Nachtprogramms noch als "Donnerstag" - Mi ist vorbei, Do/Fr/Sa
  // bleiben aktiv (Donnerstag ist ja noch "heute" aus Sicht des Nachtprogramms).
  check('Reset am 18.09 um 2 Uhr nachts (zählt noch als Do)', { year: 2026, month: 9, day: 18, hour: 2, minute: 0 },
    ['Do 17.09', 'Fr 18.09', 'Sa 19.09']);

  // Vor Festivalbeginn - alles ist zukünftig, kein Tag wird ausgeblendet.
  check('Reset vor Festivalbeginn (1. September)', { year: 2026, month: 9, day: 1, hour: 12, minute: 0 },
    ['Mi 16.09', 'Do 17.09', 'Fr 18.09', 'Sa 19.09']);

  // Nach Festivalende - alles ist vergangen, dann lieber alles zeigen statt
  // eine leere Auswahl (kein Tag wird ausgeblendet).
  check('Reset nach Festivalende (25. September)', { year: 2026, month: 9, day: 25, hour: 12, minute: 0 },
    ['Mi 16.09', 'Do 17.09', 'Fr 18.09', 'Sa 19.09']);

  t.finish();
})();
