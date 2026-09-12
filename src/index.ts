import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";

const client = new Anthropic();

const tools: Anthropic.Tool[] = [
    {
        name: "read_file",
        description: "Odczytuje zawartość pliku tekstowego z podanej ścieżki.",
        input_schema: {
            type: "object",
            properties: { path: { type: "string" } },
            required: ["path"],
        },
    },
    {
        name: "list_files",
        description: "Zwraca listę plików w bieżącym katalogu roboczym.",
        input_schema: {
            type: "object",
            properties: {},
            required: [],
        },
    }
];

async function executeTool(name: string, input: unknown): Promise<string> {
    if (name === "read_file") {
        if (
            typeof input !== "object" ||
            input === null ||
            !("path" in input) ||
            typeof (input as any).path !== "string"
        ) {
            return "Błąd: narzędzie read_file wymaga argumentu 'path' typu string.";
        }

        const path = (input as { path: string }).path;

        try {
            const content = await readFile(path, "utf-8");
            return content;
        } catch (err) {
            return `Błąd odczytu pliku '${path}': ${(err as Error).message}`;
        }
    }

    if (name === "list_files") {
        const files = await readdir(".");
        return files.join(", ");
    }

    return `Błąd: nieznane narzędzie '${name}'.`;
}

async function main() {
    let messages: Anthropic.MessageParam[] = [
        // { role: "user", content: "Co jest w pliku notes.txt?" },
        { role: "user", content: "Wylistuj pliki w katalogu i jednocześnie pokaż zawartość notes.txt." }
    ];

    const MAX_ITERATIONS = 10;

    for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
        console.log(`\n--- Iteracja ${iteration} ---`);
        console.log("→ Wysyłam", messages.length, "wiadomości, role:", messages.map(m => m.role));

        const response = await client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1024,
            tools,
            messages,
        });

        console.log("← stop_reason:", response.stop_reason);
        console.log("← bloki w odpowiedzi:", response.content.map(b => b.type));


        if (response.stop_reason !== "tool_use") {
            console.log(response.content);
            return;
        }

        messages.push({ role: "assistant", content: response.content });

        const toolUseBlocks = response.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
        );

        const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
            toolUseBlocks.map(async (block) => ({
                type: "tool_result" as const,
                tool_use_id: block.id,
                content: await executeTool(block.name, block.input),
            }))
        );

        messages.push({ role: "user", content: toolResults });
    }

    console.warn(
        `Przekroczono limit ${MAX_ITERATIONS} iteracji. Ostatni stan messages:`,
        JSON.stringify(messages, null, 2)
    );
}

main();