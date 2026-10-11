import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Written into this lesson's own sandbox/ — never another lesson's folder.
const SANDBOX_DIR = join(dirname(fileURLToPath(import.meta.url)), 'sandbox');
const OUTPUT_FILE = join(SANDBOX_DIR, 'knowledge-base.txt');

// 8 sections x 40 paragraphs. Roughly 140 KB, which is well above the 4096-token minimum
// cacheable prefix for claude-haiku-4-5-20251001 (see the lesson README, Prerequisites).
const SECTIONS = [
  'Incident response runbook',
  'Access control policy',
  'Data retention policy',
  'Change management runbook',
  'Third-party vendor review policy',
  'Backup and recovery runbook',
  'Logging and monitoring policy',
  'On-call escalation runbook',
];
const PARAGRAPHS_PER_SECTION = 40;

// Fixed vocabularies. Paragraphs pick from these by index arithmetic, so the output is
// byte-identical on every run: no Date.now(), no Math.random().
const ROLES = [
  'the on-call engineer',
  'the service owner',
  'the security reviewer',
  'the release manager',
  'the data steward',
  'the platform team lead',
  'the support lead',
  'the incident commander',
  'the compliance officer',
  'the database administrator',
];
const ACTIONS = [
  'records the decision in the change log',
  'confirms the affected scope before taking any action',
  'opens a ticket linked to the originating alert',
  'verifies the rollback plan with a second reviewer',
  'notifies downstream consumers through the status channel',
  'snapshots the current configuration before any edit',
  'compares the access grant against the approved matrix',
  'closes the loop with the requester within one business day',
];
const TRIGGERS = [
  'when a severity-two alert stays open for more than fifteen minutes',
  'when a deployment touches customer-facing authentication',
  'when a backup restore test fails its verification step',
  'when a third-party processor changes where it stores data',
  'when log volume exceeds the agreed monthly budget',
  'when a credential is found outside the approved vault',
  'when retention windows for two regions no longer match',
  'when an escalation receives no acknowledgement after ten minutes',
];
const RULES = [
  'Two-person approval is required before any irreversible step.',
  'Evidence is stored in the incident repository, not in chat history.',
  'Deviations from this procedure need written sign-off from the policy owner.',
  'Timestamps are recorded in UTC and cross-checked against the audit log.',
  'Temporary exceptions expire automatically after seven days.',
  'Customer data is never copied into a test environment without masking.',
  'Every checklist step is marked done, skipped, or blocked, with a reason.',
  'Post-incident reviews are blameless and published within five working days.',
];
const FOLLOW_UPS = [
  'Review the outcome during the next quarterly control assessment.',
  'Update the runbook if the same gap appears twice in one quarter.',
  'Confirm the fix with a reproduction before closing the item.',
  'Escalate to the risk committee if the residual exposure is rated high.',
  'Record the time to detect and the time to recover as separate metrics.',
  'Archive the ticket with its attachments for the full retention period.',
  'Check that the monitoring rule still fires after the change is merged.',
  'Share the lessons with adjacent teams in the monthly operations review.',
];

// Wraps around the vocabulary, so any integer index is safe and deterministic.
function pick<T>(items: readonly T[], index: number): T {
  return items[((index % items.length) + items.length) % items.length];
}

function buildParagraph(section: number, index: number): string {
  const number = index + 1;
  const role = pick(ROLES, section * 3 + index);
  const action = pick(ACTIONS, section + index * 2);
  const trigger = pick(TRIGGERS, section * 5 + index);
  const rule = pick(RULES, index + section);
  const followUp = pick(FOLLOW_UPS, section * 7 + index * 3);
  const checker = pick(ROLES, section * 7 + index * 2 + 4);
  const check = pick(ACTIONS, index * 3 + section * 2 + 5);
  const reference = `RB-${section + 1}-${String(number).padStart(2, '0')}`;
  const revision = ((section * 13 + index * 5) % 9) + 1;

  return (
    `${number}. In the ${SECTIONS[section].toLowerCase()} section, ${role} ${action} ` +
    `${trigger}. ${rule} ${followUp} ` +
    `The secondary check is performed by ${checker}, who ${check}. ` +
    `Reference ${reference}, revision ${revision}.`
  );
}

function buildKnowledgeBase(): string {
  const sections: string[] = [];
  for (let s = 0; s < SECTIONS.length; s++) {
    const paragraphs: string[] = [];
    for (let p = 0; p < PARAGRAPHS_PER_SECTION; p++) {
      paragraphs.push(buildParagraph(s, p));
    }
    sections.push(`## Section ${s + 1}: ${SECTIONS[s]}\n\n${paragraphs.join('\n\n')}`);
  }
  return `${sections.join('\n\n')}\n`;
}

async function main() {
  const text = buildKnowledgeBase();
  await mkdir(SANDBOX_DIR, { recursive: true });
  await writeFile(OUTPUT_FILE, text, 'utf-8');

  const bytes = Buffer.byteLength(text, 'utf-8');
  // Heuristic only (about 4 characters per token for English prose). The exact count comes
  // from usage.input_tokens in the API response, not from this number.
  console.log(`Written ${OUTPUT_FILE}`);
  console.log(
    `  ${(bytes / 1024).toFixed(1)} KB, ${SECTIONS.length} sections, ` +
      `${SECTIONS.length * PARAGRAPHS_PER_SECTION} paragraphs`,
  );
  console.log(`  ~${Math.ceil(bytes / 4)} tokens (heuristic, bytes / 4)`);
}

main();
