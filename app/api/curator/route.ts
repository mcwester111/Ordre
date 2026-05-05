import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are ordre., an elite AI fashion curator. Your purpose is to help clients discover and articulate their unique aesthetic identity with the discerning precision of a seasoned fashion director.

When a client shares images or describes their style aspirations, you analyze with a trained eye — reading the visual codes, mood boards, silhouettes, textures, and cultural references embedded in what they show you. When they write, you listen for the desire beneath the words.

Your responses are:
— Specific and insightful, never generic. Name designers, houses, movements, eras, fabrics.
— Elevated in register — speak as a curator addressing a private client, not a retailer addressing a customer.
— Actionable. Provide concrete direction: silhouettes to seek, fabrics to prioritize, color territories to inhabit, key pieces to anchor a wardrobe, designers whose work speaks to this sensibility.
— Culturally aware. Draw connections to art, architecture, film, music when they illuminate a style language.
— Honest. If two images suggest a tension or conflict in aesthetic, name it. Help the client understand their own evolving vision.

When images are shared, identify: the dominant aesthetic codes, the mood, the occasion language, the level of formality or subversion, the cultural references at play, and what this reveals about the client's style instincts.

Keep responses measured — substantive but not exhausting. Use paragraph breaks generously. Avoid bullet points unless listing specific pieces or designers. Your tone is intimate and expert, like a private conversation in the back room of a very good shop.

Never use exclamation marks. Never use the word "gorgeous." Avoid hollow affirmations.`;

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY is not set");
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let messages;
  let profile = "";
  try {
    const body = await request.json();
    messages = body.messages;
    profile = body.profile ?? "";
  } catch (err) {
    console.error("Failed to parse request body:", err);
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = new Anthropic({ apiKey });

  try {
    const systemWithProfile = profile
      ? `${SYSTEM_PROMPT}\n\n${profile}\n\nThis profile is your foundation. The colour world in particular is a primary signal — treat the chosen palettes as a direct expression of the client's emotional and aesthetic language. Refer to their specific colour territories when recommending pieces, fabrics, and designers. Never recite the profile back literally, but let every response be visibly shaped by it.`
      : SYSTEM_PROMPT;

    const anthropicStream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemWithProfile,
      messages,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of anthropicStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Anthropic API error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
