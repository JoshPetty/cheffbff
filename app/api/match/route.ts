/**
 * app/api/match/route.ts — Pantry to Plate Recipe Matcher
 *
 * Calls Spoonacular API to find recipes matching user's ingredients.
 */

// This allows me to type the request and response objects for better type safety
import {NextRequest, NextResponse} from "next/server"; 


const SPOONACULAR_BASE = "https://api.spoonacular.com";
const API_KEY = process.env.SPOONACULAR_API_KEY ?? "";

export async function POST(req: NextRequest) {
  const { ingredients, allergies, top_n = 10 } = await req.json();

  if (!ingredients || ingredients.length === 0) {
    return NextResponse.json({ error: "No ingredients provided" }, { status: 400 });
  }



  // Find recipes by ingredients:
  // This functionr returns recipes that can be made with the give ingredients, ranked 
  const params = new URLSearchParams({
      ingredients: ingredients.join(","),
      number: String(top_n),
      ranking: "1",
      ignorePantry: "true",
      apiKey: API_KEY,
    });

 const res = await fetch(`${SPOONACULAR_BASE}/recipes/findByIngredients?${params}`);

  if (!res.ok) {
  const errorText = await res.text();
  console.error("Spoonacular error:", res.status, errorText);
  return NextResponse.json(
    { error: `Spoonacular error: ${res.status} - ${errorText}` },
    { status: 503 }
  );
}

  const matches = await res.json();

  if (!Array.isArray(matches)) {
    console.error("Spoonacular error:", matches);
    return NextResponse.json({ error: "Could not fetch recipes. Check your API key." }, { status: 502 });
  }

  // Transform Spoonacular response into ChefBFF format
  const recipes = matches
    .filter((match: any) => {
      // Filter out allergies if provided
      if (!allergies || allergies.length === 0) return true;
      const allIngredients = [
        ...match.usedIngredients,
        ...match.missedIngredients,
      ].map((i: any) => i.name.toLowerCase());
      return !allergies.some((allergy: string) =>
        allIngredients.some((ing: string) => ing.includes(allergy.toLowerCase()))
      );
    })
    .map((match: any) => {
      const total = match.usedIngredientCount + match.missedIngredientCount;
      const matchScore = Math.round((match.usedIngredientCount / total) * 100);

      return {
        title: match.title,
        match_score: matchScore,
        has_ingredients: match.usedIngredients.map((i: any) => i.name),
        needs_ingredients: match.missedIngredients.map((i: any) => i.name),
        total_ingredients: total,
        image: match.image,
        link: `https://spoonacular.com/recipes/${match.title.toLowerCase().replace(/\s+/g, "-")}-${match.id}`,
        source: "Spoonacular",
        directions: "View full recipe for directions",
      };
    });

  return NextResponse.json({
    success: true,
    count: recipes.length,
    recipes,
  });
}

export async function GET() {
  const res = await fetch(`${SPOONACULAR_BASE}/recipes/random?number=1&apiKey=${API_KEY}`);
  if (!res.ok) return NextResponse.json({ status: "offline" }, { status: 503 });
  return NextResponse.json({ status: "healthy" });
}