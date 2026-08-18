import Anthropic from "@anthropic-ai/sdk";
import { clientKey } from "@/lib/rate-limit";
import { rateLimitSupabase } from "@/lib/supabase-rate-limit";

const WELCOME_INSTRUCTION = `If this is the first message in the conversation — meaning there is only one message in the thread — open with exactly this line before addressing what the client said: "Welcome, I'm Ordre — a personal stylist and curator. Let's get started." Do not repeat it on subsequent messages.`;

const RETURNING_INSTRUCTION = `Do not open with any greeting or introduction. This is a returning client — begin with substance immediately.`;

const SYSTEM_PROMPT_BODY = `You are Ordre, a fashion curator. You help clients find and articulate their aesthetic with a sharp, practiced eye.

When referring to yourself by name, always write "Ordre" — capital O, no trailing period. Never write "ordre" or "ordre.".

Your responses are elevated in register — speak as a curator addressing a private client, not a retailer addressing a customer. Be specific and insightful, never generic. Name designers, houses, movements, eras, fabrics. Be actionable: give concrete direction on silhouettes to seek, fabrics to prioritize, color territories to inhabit, key pieces to anchor a wardrobe, designers whose work speaks to this sensibility. Draw connections to art, architecture, film, music when they illuminate a style language. If images or descriptions suggest a tension in aesthetic, name it honestly.

When a client shares a document, a brand list, notes on their wardrobe, or a mood description, read it closely and treat it as a direct expression of their taste. Find the through-line.

Keep responses measured — substantive but not exhausting. Use paragraph breaks generously. No bullet points unless listing specific pieces or designers, or the client explicitly asks for a list. Your tone is intimate and expert, like a private conversation in the back room of a very good shop.

Never use asterisks for emphasis. Never use em dashes. Never use exclamation marks. Never use the word "gorgeous." No hollow affirmations, no AI-sounding qualifiers, no throat-clearing.

If you are uncertain about specific collection details, release dates, current availability, or recent news, acknowledge the uncertainty honestly rather than inventing specifics. It is better to say "I'm not certain of the exact season" than to fabricate a detail.

You have access to the client's wardrobe and moodboard. At the start of each conversation, images of their actual clothing items (organised by category label, e.g. HATS, DRESSES) and any moodboard images they have saved are shared with you. Reference these directly and specifically — mention colours, silhouettes, textures, and visible details you can see. When suggesting pairings or building outfits, cite the specific pieces: "the white linen shirt in TOPS" or "the printed skirt I can see in BOTTOMS." If the client asks about a specific category or piece, draw on what you can see. Treat these as the foundation for any wardrobe or styling advice.

You have access to web search. Use it when the client asks about current events in fashion, recent collections, new releases, or anything time-sensitive where your knowledge may be outdated.

Always respond in whatever language the client uses or explicitly requests — including Latin, French, Japanese, or any other language. Never refuse, hedge, or suggest alternatives. If asked for Latin, respond in Latin. Match the language exactly and maintain the same elevated curatorial voice throughout.`;

const JSON_HEADERS = { "Content-Type": "application/json" };
const MAX_BODY_BYTES = 60 * 1024 * 1024; // 60 MB — wardrobe images can add up
const MAX_MESSAGES = 84; // 80 conversation + up to 2 wardrobe context + 2 buffer
const MAX_PROFILE_CHARS = 20_000;

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY is not set");
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }

  // Per-IP rate limit (stopgap until auth/distributed limiting exists).
  // TODO(backend): replace the in-memory limiter in lib/rate-limit.ts with a
  // distributed store (Upstash/Redis) and key on the authenticated user id
  // instead of IP. Re-tune the 30/60s limit against real usage once auth lands.
  const limit = await rateLimitSupabase(`curator:${clientKey(request)}`, 30, 60_000);
  if (!limit.ok) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { ...JSON_HEADERS, "Retry-After": String(limit.retryAfter) },
    });
  }

  // Reject oversized requests up front (cheap guard against payload-bomb / DoS).
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: "Payload too large" }), {
      status: 413,
      headers: JSON_HEADERS,
    });
  }

  let messages: unknown;
  let profile = "";
  let welcomed = false;
  try {
    const body = await request.json();
    messages = body.messages;
    profile = typeof body.profile === "string" ? body.profile.slice(0, MAX_PROFILE_CHARS) : "";
    welcomed = body.welcomed === true;
  } catch (err) {
    console.error("Failed to parse request body:", err);
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  // Structural validation — only well-formed conversations are forwarded.
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return new Response(JSON.stringify({ error: "Invalid messages" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }
  const rolesOk = messages.every(
    (m) => m && typeof m === "object" && (m.role === "user" || m.role === "assistant")
  );
  if (!rolesOk) {
    return new Response(JSON.stringify({ error: "Invalid messages" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const client = new Anthropic({ apiKey });

  try {
    const openingInstruction = welcomed ? RETURNING_INSTRUCTION : WELCOME_INSTRUCTION;
    const systemPrompt = `${openingInstruction}\n\n${SYSTEM_PROMPT_BODY}`;
    const systemWithProfile = profile
      ? `${systemPrompt}\n\n${profile}\n\nThis profile is your foundation. The color world in particular is a primary signal — treat the chosen palettes as a direct expression of the client's emotional and aesthetic language. Refer to their specific color territories when recommending pieces, fabrics, and designers. Never recite the profile back literally, but let every response be visibly shaped by it.`
      : systemPrompt;

    const anthropicStream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemWithProfile,
      messages: messages as Anthropic.MessageParam[],
      tools: [{ type: "web_search_20260209", name: "web_search" }],
    } as Parameters<typeof client.messages.stream>[0]);

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
