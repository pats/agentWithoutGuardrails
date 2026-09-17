import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SANDBOX_DIR = process.argv[2] ?? 'lessons/04-token-counting/sandbox'; // pass a target dir to reuse this generator for other lessons

// Fake log-style content — angielski, powtarzalny ale nie identyczny (żeby nie kompresowało się do jednego tokena)
function generateEnglishLog(lines: number): string {
  const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
  const services = ['auth-service', 'billing-worker', 'api-gateway', 'notification-queue'];
  const messages = [
    'request processed successfully',
    'connection pool exhausted, retrying',
    'cache miss, falling back to database',
    'rate limit threshold approaching for client',
    'scheduled job completed in',
    'unexpected null value in response payload',
  ];

  const out: string[] = [];
  for (let i = 0; i < lines; i++) {
    const level = levels[i % levels.length];
    const service = services[i % services.length];
    const message = messages[i % messages.length];
    const timestamp = new Date(Date.now() - i * 1000).toISOString();
    out.push(
      `[${timestamp}] ${level} (${service}): ${message} — request_id=${i.toString(16).padStart(8, '0')}`,
    );
  }
  return out.join('\n');
}

// Ten sam kształt danych, ale po polsku — do porównania błędu heurystyki EN vs PL
function generatePolishLog(lines: number): string {
  const levels = ['INFO', 'OSTRZEŻENIE', 'BŁĄD', 'DEBUG'];
  const services = ['usługa-autoryzacji', 'proces-rozliczeń', 'brama-api', 'kolejka-powiadomień'];
  const messages = [
    'żądanie przetworzone pomyślnie',
    'pula połączeń wyczerpana, ponawiam próbę',
    'brak w pamięci podręcznej, odczyt z bazy danych',
    'zbliżam się do limitu żądań dla klienta',
    'zaplanowane zadanie zakończone w czasie',
    'nieoczekiwana wartość null w odpowiedzi',
  ];

  const out: string[] = [];
  for (let i = 0; i < lines; i++) {
    const level = levels[i % levels.length];
    const service = services[i % services.length];
    const message = messages[i % messages.length];
    const timestamp = new Date(Date.now() - i * 1000).toISOString();
    out.push(
      `[${timestamp}] ${level} (${service}): ${message} — id_żądania=${i.toString(16).padStart(8, '0')}`,
    );
  }
  return out.join('\n');
}

async function main() {
  await mkdir(SANDBOX_DIR, { recursive: true });

  const files = [
    { name: 'access-log-en.txt', content: generateEnglishLog(4000) },
    { name: 'access-log-pl.txt', content: generatePolishLog(4000) },
    { name: 'audit-log-en.txt', content: generateEnglishLog(6000) },
  ];

  for (const file of files) {
    const path = join(SANDBOX_DIR, file.name);
    await writeFile(path, file.content, 'utf-8');
    const sizeKb = (Buffer.byteLength(file.content, 'utf-8') / 1024).toFixed(1);
    console.log(`Written ${path} (${sizeKb} KB, ${file.content.split('\n').length} lines)`);
  }
}

main();
