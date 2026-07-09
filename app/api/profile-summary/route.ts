import Anthropic from "@anthropic-ai/sdk";
import { clientKey } from "@/lib/rate-limit";
import { rateLimitSupabase } from "@/lib/supabase-rate-limit";

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  const limit = await rateLimitSupabase(`profile:${clientKey(request)}`, 12, 60_000);
  if (!limit.ok) {
    return Response.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  // Guard against oversized bodies; the profile is a short descriptor.
  if (Number(request.headers.get("content-length") || 0) > 256 * 1024) {
    return Response.json({ error: "Payload too large" }, { status: 413 });
  }

  let profile = "";
  try {
    const body = await request.json();
    profile = typeof body.profile === "string" ? body.profile.slice(0, 20_000) : "";
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const prompt = `You are ordre., a fashion curator with an exceptionally discerning eye. A client has just completed their aesthetic profile. Write their portrait.

Client profile: ${profile}

Follow this exact format — no deviations, no extra text:

[Two sentences, spoken directly to the client as "You", describing their likely physical presence, the mood they inhabit, and what they are instinctively drawn to. Be specific to their profile — reference their color world, their contrast level, their era, their form and sensibility directly. Poetic but grounded. Do not begin with "You have" — begin with a more unexpected construction.]

Those who may share your sensibility:
✦ [Full name]
✦ [Full name]
✦ [Full name]
✦ [Full name]

If the curation is "menswear", draw figures exclusively from the men's style canon: Cary Grant, Gary Cooper, Marcello Mastroianni, Alain Delon, Steve McQueen, Paul Newman, Marlon Brando, David Bowie, Nick Cave, Bryan Ferry, Fred Astaire, Tom Ford, Lenny Kravitz, Miles Davis, Helmut Berger. If the curation is "both", draw a considered mix from both canons.

Each of the four figures must be a precise, considered match — chosen because their specific coloring, aesthetic spirit, silhouette, or era genuinely mirrors this client's profile. These are people who would dress, move, and inhabit the world in a way that resonates with this exact profile. They may be drawn from fashion, film, music, art, literature or cultural history. Draw from a vocabulary that prizes quiet authority over spectacle: Audrey Hepburn, Grace Kelly, Katharine Hepburn, Lauren Bacall, Ava Gardner, Ingrid Bergman, Romy Schneider, Monica Vitti, Jeanne Moreau, Catherine Deneuve, Faye Dunaway, Brigitte Bardot, Rita Hayworth, Bette Davis, Anjelica Huston, Marisa Berenson, Ali MacGraw, Lauren Hutton, Jane Birkin, Ines de la Fressange, Carolyn Bessette-Kennedy, Sofia Coppola, Emmanuelle Alt, Tilda Swinton, Charlotte Rampling, Isabelle Huppert, Grace Coddington, Penélope Cruz, Catherine Princess of Wales, Cate Blanchett, Gwyneth Paltrow, Olivia Palermo, Jacqueline Kennedy Onassis, Diane von Furstenberg, Bianca Jagger. Think old Hollywood composure, classic European cinema, and the modern women who inherited that ease — the person who wears Toteme or Lemaire or The Row because they understand it. At least three of the four must be widely known at the level of the examples above. The fourth may be slightly more niche but still recognizable to anyone with a serious cultural education. Avoid designers, photographers, and art-world figures unless they are genuinely household names. Never suggest Siouxsie Sioux.

No quotation marks. No exclamation marks. No pleasantries. No explanation of choices.`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 320,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return Response.json({ summary: text });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
