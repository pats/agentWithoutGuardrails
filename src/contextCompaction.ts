import type Anthropic from '@anthropic-ai/sdk';

const MAX_TRANSCRIPT_CHARS = 400_000; // conservative — leaves headroom for the system prompt
// and the summary response itself, well under the 200k-token real API limit. If the raw
// history is larger than this, it gets truncated before being sent for summarization —
// otherwise the summarization call itself could exceed the context limit (see lesson 04/05).

export async function compactHistory(
  client: Anthropic,
  model: string,
  originalTaskText: string,
  messages: Anthropic.MessageParam[],
): Promise<Anthropic.MessageParam[]> {
  console.log('  [compaction] threshold exceeded — summarizing history');

  let transcript = JSON.stringify(messages, null, 2);

  if (transcript.length > MAX_TRANSCRIPT_CHARS) {
    const omitted = transcript.length - MAX_TRANSCRIPT_CHARS;
    // Keep the MOST RECENT part of the transcript, not the oldest — recent tool results
    // are what the agent needs to avoid repeating work it already did. Truncating from
    // the start (as an earlier version of this function did) caused the agent to re-read
    // files it had already processed, because the summary never saw those later turns.
    transcript = `[...earlier transcript truncated, ${omitted} characters omitted...]\n\n${transcript.slice(-MAX_TRANSCRIPT_CHARS)}`;
    console.log(
      `  [compaction] transcript too large (${transcript.length + omitted} chars) — kept most recent ${MAX_TRANSCRIPT_CHARS} chars`,
    );
  }

  const summaryResponse = await client.messages.create({
    model,
    max_tokens: 1024,
    system:
      'Summarize the following agent conversation history concisely. Preserve: what has been done so far (which files were read or written, and their key content/findings), and what still remains to complete the original task. Do NOT include full file contents — only note which files were already processed and their key takeaways. This summary will fully replace the detailed history, so it must be self-sufficient for continuing the task without re-reading already-processed files.',
    messages: [{ role: 'user', content: transcript }],
  });

  const summaryText = summaryResponse.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  console.log(
    `  [compaction] summary (${summaryText.length} chars): ${summaryText.slice(0, 200)}...`,
  );

  const compactedContent = `${originalTaskText}\n\n[Progress so far — history compacted due to context limit]\n${summaryText}\n\nContinue the task from here.`;

  return [{ role: 'user', content: compactedContent }];
}
