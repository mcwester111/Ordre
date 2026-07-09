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
      messages: [{
        role: "user",
        content: `Give this conversation a short, elegant title — 3 to 5 words, no quotes, no punctuation at the end. The opening message was: "${firstMessage}"`,
      }],
    });

    const title = response.content[0].type === "text"
      ? response.content[0].text.trim().replace(/^["']|["']$/g, "")
      : "New conversation";

    return Response.json({ title });
  } catch {
    return Response.json({ title: firstMessage.slice(0, 50) });
  }
}
