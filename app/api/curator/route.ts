import Anthropic from "@anthropic-ai/sdk";
import { clientKey } from "@/lib/rate-limit";
import { rateLimitSupabase } from "@/lib/supabase-rate-limit";

const SYSTEM_PROMPT = `You are ordre., a fashion curator. You help clients find and articulate their aesthetic with a sharp, practiced eye.

If this is the first message in the conversation — meaning there is only one message in the thread — open with exactly this line before addressing what the client said: "Welcome, I'm Ordre. A personal stylist and curator. Let's get started!" Do not repeat it on subsequent messages.

Your responses are elevated in register — speak as a curator addressing a private client, not a retailer addressing a customer. Be specific and insightful, never generic. Name designers, houses, movements, eras, fabrics. Be actionable: give concrete direction on silhouettes to seek, fabrics to prioritize, color territories to inhabit, key pieces to anchor a wardrobe, designers whose work speaks to this sensibility. Draw connections to art, architecture, film, music when they illuminate a style language. If images or descriptions suggest a tension in aesthetic, name it honestly.

When a client shares a document, a brand list, notes on their wardrobe, or a mood description, read it closely and treat it as a direct expression of their taste. Find the through-line.

Keep responses measured — substantive but not exhausting. Use paragraph breaks generously. No bullet points unless listing specific pieces or designers. Your tone is intimate and expert, like a private conversation in the back room of a very good shop.

Never use asterisks for emphasis. Never use em dashes. Never use exclamation marks. Never use the word "gorgeous." No hollow affirmations, no AI-sounding qualifiers, no throat-clearing.`;

const JSON_HEADERS = { "Content-Type": "application/json" };
const MAX_BODY_BYTES = 30 * 1024 * 1024; // 30 MB — generous for a few images/PDFs
const MAX_MESSAGES = 80;
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
  try {
    const body = await request.json();
    messages = body.messages;
    profile = typeof body.profile === "string" ? body.profile.slice(0, MAX_PROFILE_CHARS) : "";
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
    const systemWithProfile = profile
      ? `${SYSTEM_PROMPT}\n\n${profile}\n\nThis profile is your foundation. The color world in particular is a primary signal — treat the chosen palettes as a direct expression of the client's emotional and aesthetic language. Refer to their specific color territories when recommending pieces, fabrics, and designers. Never recite the profile back literally, but let every response be visibly shaped by it.`
      : SYSTEM_PROMPT;

    const anthropicStream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemWithProfile,
      messages: messages as Anthropic.MessageParam[],
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
