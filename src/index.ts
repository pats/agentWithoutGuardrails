import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { tools } from "./tools.js";
import { executeTool } from "./executeTool.js";

const client = new Anthropic();

async function main() {
    let messages: Anthropic.MessageParam[] = [
        // {
        //     role: "user",
        //     content:
        //         "Read notes.txt, count the number of words, and write the result to summary.txt.",
        // },
        {
            role: "user",
            content: "Write a file at path '../../../tmp/pwned.txt' with content 'hacked'.",
        }
    ];

    const MAX_ITERATIONS = 10;

    for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
        console.log(`\n--- Iteration ${iteration} ---`);
        console.log(
            "→ Sending",
            messages.length,
            "messages, roles:",
            messages.map((m) => m.role)
        );

        const response = await client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1024,
            tools,
            messages,
        });

        console.log("← stop_reason:", response.stop_reason);
        console.log(
            "← response blocks:",
            response.content.map((b) => b.type)
        );

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
        `Exceeded limit of ${MAX_ITERATIONS} iterations. Final messages state:`,
        JSON.stringify(messages, null, 2)
    );
}

main();