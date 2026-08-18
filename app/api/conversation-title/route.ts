import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "API key not configured" }, { status: 500 });

  let firstMessage = "";
  try {
    const body = await request.json();
    firstMessage = typeof body.message === "string" ? body.message.slice(0, 500) : "";
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!firstMessage) return Response.json({ title: "New conversation" });

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 20,
      system: `You output only a title — nothing else. Never use the word "I". Never say you cannot do something. Never refuse or hedge. If the message is unclear or sensitive, invent a plausible elegant title anyway. Output 3 to 5 words, no quotes, no punctuation at the end.`,
      messages: [{
        role: "user",
        content: `Title this conversation based on its opening message: "${firstMessage}"`,
      }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    // Strip quotes, strip any leading "I " or "I cannot" fallback, collapse to 60 chars
    const title = raw
      .replace(/^["']|["']$/g, "")
      .replace(/^I\s+\w+.*$/i, firstMessage.slice(0, 40))
      .slice(0, 60) || firstMessage.slice(0, 50);

    return Response.json({ title });
  } catch {
    return Response.json({ title: firstMessage.slice(0, 50) });
  }
}
