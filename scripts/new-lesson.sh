#!/usr/bin/env bash
# Scaffolds a new lesson: tags the -start commit, creates the script
# stub, the doc from TEMPLATE.md, and wires up package.json + README.
#
# Usage:
#   ./scripts/new-lesson.sh <NN> <kebab-slug> ["Title Case Name"]
#
# Example:
#   ./scripts/new-lesson.sh 06 prompt-caching "Prompt Caching Mechanics"
#
# See the "Lesson lifecycle" section in AGENTS.md for what happens
# after this: you still have to do the actual learning, then fill in
# Before/After/Conclusions yourself and tag -done when finished.

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
DOC_PATH="docs/lessons/${NN}-${SLUG}.md"
SCRIPT_PATH="src/lessons/${FILE_NAME}.ts"
START_TAG="lesson-${NN}-${SLUG}-start"
DONE_TAG="lesson-${NN}-${SLUG}-done"

if [ -e "$DOC_PATH" ] || [ -e "$SCRIPT_PATH" ]; then
  echo "Już istnieje: $DOC_PATH albo $SCRIPT_PATH — nic nie nadpisuję." >&2
  exit 1
fi
if git rev-parse -q --verify "refs/tags/$START_TAG" >/dev/null; then
  echo "Tag $START_TAG już istnieje — nic nie nadpisuję." >&2
  exit 1
fi

# 1. Tag -start ZANIM powstanie jakikolwiek kod tej lekcji
git tag "$START_TAG"
START_HASH="$(git rev-parse --short "$START_TAG")"
echo "Otagowano $START_TAG -> $START_HASH"

# 2. Stub skryptu lekcji
cat > "$SCRIPT_PATH" << EOF
import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
// import { executeTool } from '../executeTool.js';
// import { tools } from '../tools.js';

const client = new Anthropic();
const MODEL = 'claude-haiku-4-5-20251001';

async function run() {
  console.log('\\n=== LESSON ${NN}: ${TITLE} ===');
  // TODO: implement the experiment.
}

run();
EOF
echo "Utworzono $SCRIPT_PATH"

# 3. Dokument z TEMPLATE.md, z podstawionymi placeholderami
sed \
  -e "s/^# NN — <Lesson title>/# ${NN} — ${TITLE}/" \
  -e "s#<fileName>#${FILE_NAME}#g" \
  -e "s/pnpm run lesson:NN/pnpm run lesson:${NN}/g" \
  -e "s/lesson-NN-<slug>/lesson-${NN}-${SLUG}/g" \
  docs/lessons/TEMPLATE.md > "$DOC_PATH"

node -e "
const fs = require('fs');
const p = '$DOC_PATH';
let s = fs.readFileSync(p, 'utf8');
s = s.replace('\`$START_TAG\` (\`<commit-hash>\`)', '\`$START_TAG\` (\`$START_HASH\`)');
s = s.replace('\`$DONE_TAG\` (\`<commit-hash>\`)', '\`$DONE_TAG\` (\`<fill in after tagging -done>\`)');
fs.writeFileSync(p, s);
"
echo "Utworzono $DOC_PATH"

# 4. package.json — alias lesson:NN
node -e "
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('package.json', 'utf8'));
p.scripts['lesson:${NN}'] = 'tsx src/lessons/${FILE_NAME}.ts';
fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n');
"
echo "Dodano alias lesson:${NN} w package.json"

# 5. README — wiersz w tabeli
node -e "
const fs = require('fs');
const path = 'README.md';
let s = fs.readFileSync(path, 'utf8');
const marker = '|---|---|---|---|---|---|\n';
const row = '| ${NN} | \`src/lessons/${FILE_NAME}.ts\` | \`${DOC_PATH}\` | \`pnpm run lesson:${NN}\` | \`${START_TAG}\` | \`${DONE_TAG}\` |\n';
if (!s.includes(marker)) { console.error('Nie znaleziono nagłówka tabeli w README — dodaj wiersz ręcznie.'); process.exit(1); }
s = s.replace(marker, marker + row);
fs.writeFileSync(path, s);
"
echo "Dodano wiersz do tabeli w README.md"

echo
echo "Gotowe. Zostało:"
echo "  1. Zrób samą naukę / eksperyment w $SCRIPT_PATH"
echo "  2. Uzupełnij $DOC_PATH: Before (PRZED odpaleniem), After (realny output), Conclusions"
echo "  3. git add -A && git commit -m \"feat: lesson ${NN} — ${TITLE}\""
echo "  4. git tag ${DONE_TAG}"
echo "  5. git push && git push --tags"
