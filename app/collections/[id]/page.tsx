import { createClient as createServerClient } from "@/lib/supabase-server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Navigation } from "@/app/components/Navigation/Navigation";
import { Footer } from "@/app/components/Footer/Footer";
import { RecipeCard } from "@/app/components/RecipeCard/RecipeCard";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: collection } = await supabase
    .from("collections")
    .select("id, user_id, name, description, is_public")
    .eq("id", id)
    .single();

  if (!collection) notFound();

  if (!collection.is_public && (!user || user.id !== collection.user_id)) {
    redirect("/collections");
  }

  const { data: collectionRecipes } = await supabase
    .from("collection_recipes")
    .select("recipe_id")
    .eq("collection_id", id);

  const recipeIds = (collectionRecipes ?? []).map((cr) => cr.recipe_id);

  let recipes: any[] = [];

  if (recipeIds.length > 0) {
    const { data: recipesData } = await supabase
      .from("recipes")
      .select("id, title, description, image_url, ingredients, user_id")
      .in("id", recipeIds);

    const authorIds = [...new Set((recipesData ?? []).map((r) => r.user_id).filter(Boolean))];

    const { data: profiles } = authorIds.length
      ? await supabase.from("profiles").select("user_id, username, avatar_url").in("user_id", authorIds)
      : { data: [] };

    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p]));

    recipes = (recipesData ?? []).map((r) => ({
      ...r,
      author: profileMap[r.user_id] ?? null,
    }));
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <main style={{ paddingTop: "5rem", paddingBottom: "4rem" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "2rem" }}>
          <Link href="/collections" style={{ fontSize: 14, fontWeight: 600, color: "#86C540", textDecoration: "none", display: "inline-block", marginBottom: "1.5rem" }}>
            ← My Collections
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#111827", margin: 0 }}>
              {collection.name}
            </h1>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
              background: collection.is_public ? "rgba(134,197,64,0.15)" : "#f3f4f6",
              color: collection.is_public ? "#4a8f15" : "#6b7280",
              textTransform: "uppercase", letterSpacing: "0.05em",
            }}>
              {collection.is_public ? "Public" : "Private"}
            </span>
          </div>
          {collection.description && (
            <p style={{ color: "#6b7280", fontSize: "0.9375rem", margin: "0 0 0.375rem" }}>
              {collection.description}
            </p>
          )}
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: "0 0 2rem" }}>
            {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
          </p>
          {recipes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "5rem 1rem" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🍳</div>
              <p style={{ color: "#374151", fontWeight: 600, fontSize: "1.125rem", margin: "0 0 0.375rem" }}>
                This collection is empty
              </p>
              <p style={{ color: "#9ca3af", margin: "0 0 1.5rem" }}>
                Browse recipes and save them using the 🔖 button.
              </p>
              <Link href="/recipes" style={{
                display: "inline-block", padding: "0.625rem 1.5rem", borderRadius: 10,
                background: "linear-gradient(135deg, #86C540, #5DC2D1)",
                color: "#fff", fontWeight: 600, fontSize: 14, textDecoration: "none",
              }}>
                Browse Recipes
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}