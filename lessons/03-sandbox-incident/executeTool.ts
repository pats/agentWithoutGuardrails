import { readdir, readFile, writeFile } from 'node:fs/promises';
import { z } from 'zod';
import { isProtectedFile } from './protectedFiles.js';
import { isPathSafe } from './security.js';

const SANDBOX_DIR = 'lessons/03-sandbox-incident/sandbox';

const ReadFileInput = z.object({ path: z.string() });
const WriteFileInput = z.object({ path: z.string(), content: z.string() });

// Same tool set and SANDBOX_DIR scoping as sandboxIncident.ts, but every read/write
// now also goes through isPathSafe + isProtectedFile — the two guards added after the
// original incident (see lessons/02-system-prompt/executeTool.ts, docs/incidents.md).
export async function executeTool(name: string, input: unknown): Promise<string> {
  const fullPath = (p: string) => `${SANDBOX_DIR}/${p}`;

  if (name === 'read_file') {
    const parsed = ReadFileInput.safeParse(input);
    if (!parsed.success) return `Error: invalid arguments — ${parsed.error.message}`;
    const { path } = parsed.data;
    const resolvedPath = fullPath(path);

    if (!isPathSafe(resolvedPath)) {
      return `Error: path '${path}' resolves outside the allowed working directory.`;
    }
    if (isProtectedFile(resolvedPath)) {
      return `Error: '${path}' is a protected file and cannot be read by this agent.`;
    }

    try {
      return await readFile(resolvedPath, 'utf-8');
    } catch (err) {
      return `Error reading file: ${(err as Error).message}`;
    }
  }

  if (name === 'list_files') {
    return (await readdir(SANDBOX_DIR)).join(', ');
  }

  if (name === 'write_file') {
    const parsed = WriteFileInput.safeParse(input);
    if (!parsed.success) return `Error: invalid arguments — ${parsed.error.message}`;
    const { path, content } = parsed.data;
    const resolvedPath = fullPath(path);

    if (!isPathSafe(resolvedPath)) {
      return `Error: path '${path}' resolves outside the allowed working directory.`;
    }
    if (isProtectedFile(resolvedPath)) {
      return `Error: '${path}' is a protected file and cannot be modified by this agent.`;
    }

    try {
      await writeFile(resolvedPath, content, 'utf-8');
      return `Written to ${path}`;
    } catch (err) {
      return `Error writing file: ${(err as Error).message}`;
    }
  }

  return `Error: unknown tool '${name}'.`;
}
