import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "node:fs/promises";

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
        name: "flaky_tool",
        description: "Narzędzie testowe, czasem zawodzi.",
        input_schema: {
            type: "object",
            properties: { attempt: { type: "string" } },
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

    if (name === "flaky_tool") {
        return "Błąd: spróbuj ponownie z innym argumentem.";
    }

    return `Błąd: nieznane narzędzie '${name}'.`;
}

async function main() {
    let messages: Anthropic.MessageParam[] = [
        // { role: "user", content: "Co jest w pliku notes.txt?" },
        { role: "user", content: "Użyj flaky_tool aż zadziała." },
    ];

    const MAX_ITERATIONS = 10;

    for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
        const response = await client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1024,
            tools,
            messages,
        });

        if (response.stop_reason !== "tool_use") {
            console.log(response.content);
            return;
        }

        messages.push({ role: "assistant", content: response.content });

        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const block of response.content) {
            if (block.type === "tool_use") {
                const result = await executeTool(block.name, block.input);
                toolResults.push({
                    type: "tool_result",
                    tool_use_id: block.id,
                    content: result,
                });
            }
        }

        messages.push({ role: "user", content: toolResults });
    }

    console.warn(
        `Przekroczono limit ${MAX_ITERATIONS} iteracji. Ostatni stan messages:`,
        JSON.stringify(messages, null, 2)
    );
}

main();