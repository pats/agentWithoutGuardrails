#!/usr/bin/env bash
# Scaffolds a new, self-contained lesson folder: lessons/NN-<slug>/
# with a script stub + README.md from lessons/TEMPLATE/README.md, and
# wires up package.json + the top-level README.md table.
#
# No git tags — the folder on main IS the record. See "Lesson
# lifecycle" in AGENTS.md.
#
# Usage:
#   ./scripts/new-lesson.sh <NN> <kebab-slug> ["Title Case Name"]
#
# Example:
#   ./scripts/new-lesson.sh 06 prompt-caching "Prompt Caching Mechanics"
#
# If your lesson needs the tool-use loop (executeTool/tools/security/
# protectedFiles), copy them in yourself:
#   cp src/{executeTool,tools,security,protectedFiles}.ts lessons/NN-<slug>/
# and change their imports from './X.js' to match (they already use
# relative imports, so copying as-is usually just works).

set -euo pipefail

NN="${1:?Użycie: $0 <NN> <kebab-slug> [\"Title\"]}"
SLUG="${2:?Użycie: $0 <NN> <kebab-slug> [\"Title\"]}"
TITLE="${3:-}"

if ! [[ "$NN" =~ ^[0-9]{2}$ ]]; then
  echo "NN musi być dwucyfrowe, np. 06 (dostałem: $NN)" >&2
  exit 1
fi
if ! [[ "$SLUG" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "slug musi być kebab-case, np. prompt-caching (dostałem: $SLUG)" >&2
  exit 1
fi
if [ -z "$TITLE" ]; then
  TITLE="$(node -e "console.log(process.argv[1].split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' '))" "$SLUG")"
fi

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "Nie jestem w repozytorium git." >&2
  exit 1
}
cd "$REPO_ROOT"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Worktree ma niezacommitowane zmiany w śledzonych plikach — dokończ" >&2
  echo "albo scommituj poprzednią pracę zanim zaczniesz nową lekcję." >&2
  exit 1
fi

FILE_NAME="$(node -e "const s=process.argv[1].split('-'); console.log(s.map((w,i)=>i===0?w:w[0].toUpperCase()+w.slice(1)).join(''))" "$SLUG")"
LESSON_DIR="lessons/${NN}-${SLUG}"

if [ -e "$LESSON_DIR" ]; then
  echo "Już istnieje: $LESSON_DIR — nic nie nadpisuję." >&2
  exit 1
fi
if ! [ -f "lessons/TEMPLATE/README.md" ]; then
  echo "Brak lessons/TEMPLATE/README.md — nie mogę zbudować README dla nowej lekcji." >&2
  exit 1
fi

mkdir -p "$LESSON_DIR"

# 1. Stub skryptu lekcji
cat > "$LESSON_DIR/${FILE_NAME}.ts" << EOF
import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
// Jeśli ta lekcja potrzebuje pętli tool-use, skopiuj do tego folderu:
//   cp src/{executeTool,tools,security,protectedFiles}.ts ${LESSON_DIR}/
// i odkomentuj poniżej (importy są już relatywne, więc zwykle działają bez zmian):
// import { executeTool } from './executeTool.js';
// import { tools } from './tools.js';

const client = new Anthropic();
const MODEL = 'claude-haiku-4-5-20251001';

async function run() {
  console.log('\\n=== LESSON ${NN}: ${TITLE} ===');
  // TODO: implement the experiment.
}

run();
EOF
echo "Utworzono $LESSON_DIR/${FILE_NAME}.ts"

# 2. README z TEMPLATE
sed \
  -e "s/^# NN — <Lesson title>/# ${NN} — ${TITLE}/" \
  -e "s#<scriptFileName>#${FILE_NAME}#g" \
  -e "s/pnpm run lesson:NN/pnpm run lesson:${NN}/g" \
  lessons/TEMPLATE/README.md > "$LESSON_DIR/README.md"
echo "Utworzono $LESSON_DIR/README.md"

# 3. package.json — alias lesson:NN
node -e "
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('package.json', 'utf8'));
p.scripts['lesson:${NN}'] = 'tsx ${LESSON_DIR}/${FILE_NAME}.ts';
fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n');
"
echo "Dodano alias lesson:${NN} w package.json"

# 4. README.md (root) — wiersz w tabeli
node -e "
const fs = require('fs');
const path = 'README.md';
let s = fs.readFileSync(path, 'utf8');
const marker = '|---|---|---|\n';
const row = '| ${NN} | \`${LESSON_DIR}/\` | \`pnpm run lesson:${NN}\` |\n';
if (!s.includes(marker)) { console.error('Nie znaleziono nagłówka tabeli w README — dodaj wiersz ręcznie.'); process.exit(1); }
s = s.replace(marker, marker + row);
fs.writeFileSync(path, s);
"
echo "Dodano wiersz do tabeli w README.md"

echo
echo "Gotowe. Zostało:"
echo "  1. (opcjonalnie) skopiuj potrzebne pliki: cp src/{executeTool,tools,security,protectedFiles}.ts $LESSON_DIR/"
echo "  2. Zrób samą naukę / eksperyment w $LESSON_DIR/${FILE_NAME}.ts"
echo "  3. Uzupełnij $LESSON_DIR/README.md: Before (PRZED odpaleniem), After (realny output), Conclusions"
echo "  4. git add -A && git commit -m \"feat: lesson ${NN} — ${TITLE}\""
echo "  5. git push"
