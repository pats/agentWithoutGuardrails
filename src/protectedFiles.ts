import { resolve } from "node:path";

const PROTECTED_FILES = [".env", ".env.example", "package.json", "pnpm-lock.yaml"];

export function isProtectedFile(userPath: string): boolean {
    const resolvedPath = resolve(process.cwd(), userPath);
    const filename = resolvedPath.split("/").pop() ?? "";
    return PROTECTED_FILES.includes(filename);
}