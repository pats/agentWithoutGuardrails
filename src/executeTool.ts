import { readdir, readFile, writeFile } from 'node:fs/promises';
import { isProtectedFile } from './protectedFiles.js';
import { isPathSafe } from './security.js';
import { ReadFileInput, WriteFileInput } from './tools.js';

export async function executeTool(name: string, input: unknown): Promise<string> {
  if (name === 'read_file') {
    const parsed = ReadFileInput.safeParse(input);
    if (!parsed.success) {
      return `Error: invalid arguments for read_file — ${parsed.error.message}`;
    }
    const { path } = parsed.data;

    if (!isPathSafe(path)) {
      return `Error: path '${path}' resolves outside the allowed working directory.`;
    }

    try {
      return await readFile(path, 'utf-8');
    } catch (err) {
      return `Error reading file '${path}': ${(err as Error).message}`;
    }
  }

  if (name === 'list_files') {
    try {
      const files = await readdir('.');
      return files.join(', ');
    } catch (err) {
      return `Error listing directory: ${(err as Error).message}`;
    }
  }

  if (name === 'write_file') {
    const parsed = WriteFileInput.safeParse(input);
    if (!parsed.success) {
      return `Error: invalid arguments for write_file — ${parsed.error.message}`;
    }
    const { path, content } = parsed.data;

    if (!isPathSafe(path)) {
      return `Error: path '${path}' resolves outside the allowed working directory.`;
    }

    if (isProtectedFile(path)) {
      return `Error: '${path}' is a protected file and cannot be modified by this agent.`;
    }

    try {
      await writeFile(path, content, 'utf-8');
      return `Written to ${path}`;
    } catch (err) {
      return `Error writing file '${path}': ${(err as Error).message}`;
    }
  }

  return `Error: unknown tool '${name}'.`;
}
