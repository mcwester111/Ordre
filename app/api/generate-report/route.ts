import Anthropic from "@anthropic-ai/sdk";
import { ReportData } from "@/components/pdf/StyleReportDocument";

// Future paywall: add auth check here before proceeding
// e.g. const session = await getServerSession(); if (!session?.isPremium) return 403

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  let messages: { role: string; content: string }[] = [];
  let profile = "";
  let portrait = "";

  try {
    const body = await request.json();
    messages = body.messages ?? [];
    profile = body.profile ?? "";
    portrait = body.portrait ?? "";
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  // Summarise the conversation for context
  const conversationText = messages
    .map((m) => {
      const content = typeof m.content === "string" ? m.content : "[image shared]";
      return `${m.role === "user" ? "Client" : "Curator"}: ${content}`;
    })
    .join("\n\n");

  const prompt = `You are ordre., an AI fashion curator. Based on this client's aesthetic profile and curation conversation, generate a comprehensive personal style report as a single JSON object.

CLIENT PROFILE:
${profile}

PORTRAIT:
${portrait}

CURATION CONVERSATION:
${conversationText}

Generate ONLY a JSON object — no markdown fences, no explanation, no extra text. Exactly this shape:

{
  "palette": [
    {
      "name": "Colour name (evocative, 1-3 words)",
      "hex": "#XXXXXX",
      "role": "Foundation",
      "note": "One sentence on how to use this colour in their wardrobe."
    }
  ],
  "combinations": [
    {
      "name": "Combination name (short, evocative)",
      "colors": ["#XXXXXX", "#XXXXXX", "#XXXXXX"],
      "description": "Two sentences describing how these colours work together and when to wear this combination."
    }
  ],
  "brands": {
    "luxury": ["Brand", "Brand", "Brand", "Brand", "Brand"],
    "midLuxury": ["Brand", "Brand", "Brand", "Brand", "Brand"],
    "affordable": ["Brand", "Brand", "Brand", "Brand", "Brand"]
  },
  "styleNotes": "Three sentences distilling this client's core aesthetic direction, the silhouettes and fabrics that serve them best, and one bold piece of curatorial advice."
}

Requirements:
- palette: exactly 5-6 colours. Include a mix of roles: Foundation (base/neutral), Accent (supporting), Statement (bold/signature). Colours must be genuinely tailored to their profile and complexion contrast level.
- combinations: exactly 3-4 outfit colour pairings. Each should feel wearable and specific to their palette.
- brands: luxury tier (e.g. The Row, Bottega Veneta, Loewe), mid-luxury (e.g. Totême, A.P.C., Jacquemus), affordable (e.g. COS, & Other Stories, Arket). All should genuinely match the client's aesthetic — do not just list generic brands.
- styleNotes: substantive curatorial direction, not generic. Specific to this client.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1800,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON — handle any stray markdown the model might add
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in response:", text);
      return Response.json(
        { error: "Failed to generate report data" },
        { status: 500 }
      );
    }

    const reportData: ReportData = JSON.parse(jsonMatch[0]);
    return Response.json({ reportData });
  } catch (err) {
    console.error("Report generation error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
