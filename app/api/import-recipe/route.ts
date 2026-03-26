import { NextRequest, NextResponse } from "next/server";

const CATEGORIES = [
  "Breakfast", "Lunch", "Dinner", "Dessert", "Snack",
  "Soup", "Salad", "Baking", "Vegetarian", "Vegan",
];

function stripHtml(html: string): string {
  // Remove scripts and styles wholesale
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, " ");
  // Replace block-level tags with newlines so content stays readable
  text = text.replace(/<\/(p|li|tr|div|h[1-6]|br)>/gi, "\n");
  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, " ");
  // Collapse whitespace
  text = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return text;
}

export async function POST(req: NextRequest) {
  let url: string;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // ── Fetch webpage ─────────────────────────────────────────────────────────
  let pageText: string;
  try {
    const res = await fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
  },
  signal: AbortSignal.timeout(10_000),
});
    if (!res.ok) {
      return NextResponse.json(
        { error: `Could not fetch the page (HTTP ${res.status})` },
        { status: 422 }
      );
    }
    const html = await res.text();
    pageText = stripHtml(html).slice(0, 12_000);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch URL";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  // ── Call Anthropic API ───────────────────────────────────────────────────
const prompt = `Extract the recipe from this webpage content and return ONLY a JSON object with these exact fields:
- title: string
- description: string (1-2 sentences about the dish)
- ingredients: string[] (each ingredient as '2 cups flour' format)
- instructions: string[] (each step as a separate string, look for numbered steps, directions, method, preparation steps, or any cooking instructions even if not labeled clearly)
- prep_time: number (minutes, or null if not found)
- cook_time: number (minutes, or null if not found)
- servings: number (or null if not found)
- category: one of: ${CATEGORIES.join(", ")} (best guess)

IMPORTANT RULES:
- For instructions, look for ANY of these labels: Instructions, Directions, Method, Steps, Preparation, How to make, Procedure
- If steps are numbered (1. 2. 3.) extract each as a separate string
- If no instructions found, look for any sequential cooking actions in the text
- Never return an empty instructions array if there is ANY cooking guidance on the page
- Return only valid JSON, no markdown, no explanation.

Webpage content:
${pageText}`;

  let imported: Record<string, unknown>;
  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("Anthropic error:", errText);
      return NextResponse.json(
        { error: "AI extraction failed. Please try again." },
        { status: 502 }
      );
    }

    const anthropicData = await anthropicRes.json();
    const rawText: string =
      anthropicData?.content?.[0]?.text ?? "";

    // Strip any accidental markdown code fences
    const jsonText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    imported = JSON.parse(jsonText);
  } catch (err: unknown) {
    console.error("Parse error:", err);
    return NextResponse.json(
      { error: "Could not parse recipe from this page. Try a different URL." },
      { status: 422 }
    );
  }

  return NextResponse.json(imported);
}
