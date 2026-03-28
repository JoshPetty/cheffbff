import type { Metadata } from "next";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata: Metadata = { title: "My Library | ChefBFF" };
import { RecipeCard } from "@/app/components/RecipeCard/RecipeCard";

export default async function LibraryPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // ── Fetch library recipe IDs ordered by save date ─────────────────────
  const { data: libraryItems } = await supabase
    .from("library")
    .select("recipe_id, saved_at")
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false });

  const recipeIds = (libraryItems ?? []).map((l) => l.recipe_id);

  // ── Fetch recipe details + author profiles ─────────────────────────────
  let recipes: {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    ingredients: string[] | null;
    category: string | null;
    cook_time: number | null;
    user_id: string;
    author: { username: string | null; avatar_url: string | null } | null;
  }[] = [];

  if (recipeIds.length > 0) {
    const { data: recipesData } = await supabase
      .from("recipes")
      .select(
        "id, title, description, image_url, ingredients, category, cook_time, user_id"
      )
      .in("id", recipeIds);

    const authorIds = [
      ...new Set(
        (recipesData ?? []).map((r) => r.user_id).filter(Boolean)
      ),
    ];

    const { data: profiles } = authorIds.length
      ? await supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .in("user_id", authorIds)
      : { data: [] };

    const profileMap = Object.fromEntries(
      (profiles ?? []).map((p) => [p.user_id, p])
    );

    // Preserve saved_at order
    const recipeMap = Object.fromEntries(
      (recipesData ?? []).map((r) => [r.id, r])
    );
    recipes = recipeIds
      .map((id) => recipeMap[id])
      .filter(Boolean)
      .map((r) => ({ ...r, author: profileMap[r.user_id] ?? null }));
  }

  return (
    <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "2.5rem 2rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "1.875rem",
            fontWeight: 700,
            color: "#111827",
            margin: "0 0 0.25rem",
          }}
        >
          My Library
        </h1>
        {recipes.length > 0 && (
          <p style={{ fontSize: "0.9375rem", color: "#6b7280", margin: 0 }}>
            {recipes.length} saved {recipes.length === 1 ? "recipe" : "recipes"}
          </p>
        )}
      </div>

      {/* Empty state */}
      {recipes.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "5rem 1rem",
            borderRadius: 16,
            background: "#fff",
            border: "1.5px dashed #e5e7eb",
          }}
        >
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🔖</div>
          <p
            style={{
              color: "#374151",
              fontWeight: 600,
              fontSize: "1.125rem",
              margin: "0 0 0.375rem",
            }}
          >
            No saved recipes yet
          </p>
          <p style={{ color: "#9ca3af", margin: "0 0 1.5rem", fontSize: "0.9375rem" }}>
            Browse recipes and tap 🔖 to save them here.
          </p>
          <Link
            href="/recipes"
            style={{
              display: "inline-block",
              padding: "0.625rem 1.5rem",
              borderRadius: 10,
              background: "linear-gradient(135deg, #86C540, #5DC2D1)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Discover
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
