import { resolve, relative } from "node:path";

export function isPathSafe(userPath: string): boolean {
    const baseDir = resolve(process.cwd());
    const resolvedPath = resolve(baseDir, userPath);
    const rel = relative(baseDir, resolvedPath);
    return rel !== "" && !rel.startsWith("..") && !resolve(rel).includes("..");
}