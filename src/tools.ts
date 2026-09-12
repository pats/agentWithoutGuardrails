import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";

export const ReadFileInput = z.object({ path: z.string() });
export const WriteFileInput = z.object({ path: z.string(), content: z.string() });

export const tools: Anthropic.Tool[] = [
    {
        name: "read_file",
        description: "Reads the contents of a text file at the given path.",
        input_schema: {
            type: "object",
            properties: { path: { type: "string" } },
            required: ["path"],
        },
    },
    {
        name: "list_files",
        description: "Returns the list of files in the current working directory.",
        input_schema: {
            type: "object",
            properties: {},
            required: [],
        },
    },
    {
        name: "write_file",
        description: "Writes text content to a file at the given path.",
        input_schema: {
            type: "object",
            properties: {
                path: { type: "string" },
                content: { type: "string" },
            },
            required: ["path", "content"],
        },
    },
];