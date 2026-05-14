import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  let profile = "";
  try {
    const body = await request.json();
    profile = body.profile ?? "";
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const prompt = `You are ordre., a fashion curator with an exceptionally discerning eye. A client has just completed their aesthetic profile. Write their portrait.

Client profile: ${profile}

Follow this exact format — no deviations, no extra text:

[Two sentences, spoken directly to the client as "You", describing their likely physical presence, the mood they inhabit, and what they are instinctively drawn to. Be specific to their profile — reference their colour world, their contrast level, their era, their form and sensibility directly. Poetic but grounded. Do not begin with "You have" — begin with a more unexpected construction.]

Those who may share your sensibility:
✦ [Full name]
✦ [Full name]
✦ [Full name]
✦ [Full name]

Each of the four figures must be a precise, considered match — chosen because their specific colouring, aesthetic spirit, silhouette, or era genuinely mirrors this client's profile. These are people who would dress, move, and inhabit the world in a way that resonates with this exact profile. They may be drawn from fashion, film, music, art, literature or cultural history. At least three of the four must be widely known — think the level of Madonna, Audrey Hepburn, David Bowie, Cate Blanchett, Kate Moss. The fourth may be slightly less mainstream but still recognisable to anyone with a broad cultural education. Avoid designers, photographers, and art-world figures unless they are genuinely household names. Never suggest Siouxsie Sioux.

No quotation marks. No exclamation marks. No pleasantries. No explanation of choices.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 320,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return Response.json({ summary: text });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
