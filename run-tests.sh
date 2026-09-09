#!/bin/bash
# ── run-tests.sh ─────────────────────────────────────────────────────────────
# Führt alle test_*.js-Dateien in diesem Verzeichnis nacheinander aus und
# fasst das Ergebnis am Ende zusammen. Ersetzt den bisher jedes Mal manuell
# eingetippten Bash-Loop.
#
# Aufruf: ./run-tests.sh          (alle Tests)
#         ./run-tests.sh foo bar  (nur test_foo.js und test_bar.js, ohne
#                                   Präfix/Endung - praktisch beim gezielten
#                                   Nacharbeiten an einer einzelnen Änderung)

cd "$(dirname "$0")" || exit 1

if [ "$#" -gt 0 ]; then
  FILES=()
  for name in "$@"; do
    FILES+=("test_${name}.js")
  done
else
  FILES=(test_*.js)
fi

FAIL=0
FAILED_FILES=()
TMP_OUT="$(mktemp)"

for f in "${FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "⚠️  $f nicht gefunden - übersprungen"
    continue
  fi
  echo "── $f ──"
  if node "$f" > "$TMP_OUT" 2>&1; then
    tail -1 "$TMP_OUT"
  else
    echo "❌ FEHLGESCHLAGEN"
    cat "$TMP_OUT"
    FAIL=1
    FAILED_FILES+=("$f")
  fi
  echo ""
done

rm -f "$TMP_OUT"

echo "==================================="
if [ $FAIL -eq 0 ]; then
  echo "✅ ALLE TESTS GRÜN (${#FILES[@]} Datei(en))"
else
  echo "❌ FEHLGESCHLAGENE DATEIEN: ${FAILED_FILES[*]}"
fi
exit $FAIL
