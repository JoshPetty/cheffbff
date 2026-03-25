import { createClient } from "@/lib/supabase";
import { Navigation } from "@/app/components/Navigation/Navigation";
import { Footer } from "@/app/components/Footer/Footer";
import { RecipesGrid } from "./components/RecipesGrid";
import { RecipeFilters } from "./components/RecipeFilters";

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    cookTime?: string;
    sort?: string;
  }>;
}) {
  const { q = "", category = "", cookTime = "", sort = "newest" } =
    await searchParams;

  const supabase = createClient();

  let query = supabase
    .from("recipes")
    .select(
      "id, title, description, image_url, ingredients, user_id, created_at, category, cook_time, prep_time"
    );

  if (q.trim().length > 1) {
    query = query.or(
      `title.ilike.%${q.trim()}%,description.ilike.%${q.trim()}%`
    );
  }

  if (category) {
    query = query.eq("category", category);
  }

  if (cookTime === "60+") {
    query = query.gte("cook_time", 60);
  } else if (cookTime) {
    query = query.lte("cook_time", parseInt(cookTime, 10));
  }

  if (sort === "newest" || !sort) {
    query = query.order("created_at", { ascending: false });
  }

  const { data: recipes } = await query;

  // Profiles
  const userIds = [
    ...new Set((recipes ?? []).map((r) => r.user_id).filter(Boolean)),
  ];
  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", userIds)
    : { data: [] };

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.user_id, p])
  );

  const recipeIds = (recipes ?? []).map((r) => r.id);

  const [{ data: likesData }, { data: commentsData }, { data: savesData }] =
    await Promise.all([
      recipeIds.length
        ? supabase.from("likes").select("recipe_id").in("recipe_id", recipeIds)
        : { data: [] },
      recipeIds.length
        ? supabase.from("comments").select("recipe_id").in("recipe_id", recipeIds)
        : { data: [] },
      recipeIds.length
        ? supabase.from("collection_recipes").select("recipe_id").in("recipe_id", recipeIds)
        : { data: [] },
    ]);

  const likesMap = (likesData ?? []).reduce<Record<string, number>>(
    (acc, l) => { acc[l.recipe_id] = (acc[l.recipe_id] || 0) + 1; return acc; },
    {}
  );
  const commentsMap = (commentsData ?? []).reduce<Record<string, number>>(
    (acc, c) => { acc[c.recipe_id] = (acc[c.recipe_id] || 0) + 1; return acc; },
    {}
  );
  const savesMap = (savesData ?? []).reduce<Record<string, number>>(
    (acc, s) => { acc[s.recipe_id] = (acc[s.recipe_id] || 0) + 1; return acc; },
    {}
  );

  let recipesWithAuthor = (recipes ?? []).map((r) => ({
    ...r,
    author: profileMap[r.user_id] ?? null,
    likesCount: likesMap[r.id] ?? 0,
    commentsCount: commentsMap[r.id] ?? 0,
    savesCount: savesMap[r.id] ?? 0,
  }));

  if (sort === "liked") {
    recipesWithAuthor = [...recipesWithAuthor].sort(
      (a, b) => b.likesCount - a.likesCount
    );
  } else if (sort === "commented") {
    recipesWithAuthor = [...recipesWithAuthor].sort(
      (a, b) => b.commentsCount - a.commentsCount
    );
  }

  const hasActiveFilters =
    q !== "" || category !== "" || cookTime !== "" || sort !== "newest";

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main style={{ paddingTop: "5rem" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "3rem 2rem" }}>
          <h1 style={{ fontSize: "3rem", fontWeight: 700, color: "#111827", marginBottom: "1.5rem" }}>
            All Recipes
          </h1>
          <RecipeFilters
            initialQ={q}
            initialCategory={category}
            initialCookTime={cookTime}
            initialSort={sort}
            totalCount={recipesWithAuthor.length}
            hasActiveFilters={hasActiveFilters}
          />
          <RecipesGrid recipes={recipesWithAuthor} />
        </div>
      </main>
      <Footer />
    </div>
  );
}