import { NextRequest, NextResponse } from "next/server";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RecipeContext {
  title: string;
  description: string | null;
  ingredients: string[] | null;
  instructions: string[] | null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, recipe } = body as {
      messages: Message[];
      recipe: RecipeContext;
    };

    if (!messages?.length || !recipe?.title) {
      return NextResponse.json({ error: "Missing messages or recipe" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const ingredientsList = (recipe.ingredients ?? []).join("\n");
    const instructionsList = (recipe.instructions ?? [])
      .map((step, i) => `${i + 1}. ${step}`)
      .join("\n");

    const systemPrompt = `You are a helpful chef assistant for ChefBFF, a recipe sharing app. The user is viewing this recipe:

Title: ${recipe.title}${recipe.description ? `\nDescription: ${recipe.description}` : ""}
Ingredients:
${ingredientsList || "Not listed"}
Instructions:
${instructionsList || "Not listed"}

Answer questions about this specific recipe. Help with:
- Ingredient substitutions
- Dietary modifications (vegan, gluten-free etc)
- Cooking tips and techniques
- Scaling advice
- Storage and reheating tips
Keep answers concise and friendly. Max 3 sentences.`;

    // Keep last 6 messages for context
    const trimmedMessages = messages.slice(-6);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: systemPrompt,
        messages: trimmedMessages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      return NextResponse.json({ error: "Chef is unavailable, try again" }, { status: 502 });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text ?? "";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("chef-notes route error:", err);
    return NextResponse.json({ error: "Chef is unavailable, try again" }, { status: 500 });
  }
}
