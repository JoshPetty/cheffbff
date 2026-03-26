import { createClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { Navigation } from "@/app/components/Navigation/Navigation";
import { Footer } from "@/app/components/Footer/Footer";
import { RecipeDetail } from "./components/RecipeDetail";
import { RecipeOwnerActions } from "./components/RecipeOwnerActions";
import { CommentsSection } from "./components/CommentsSection";
import type { Comment } from "./components/CommentsSection";
import Link from "next/link";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createClient();

  const { data: recipe } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single();

  if (!recipe) notFound();

  // Fetch author profile separately (no FK between recipes and profiles)
  const { data: author } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("user_id", recipe.user_id)
    .maybeSingle();

  // Like count
  const { count: likeCount } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("recipe_id", id);

  // Comments + author profiles
  const { data: commentsRaw } = await supabase
    .from("comments")
    .select("id, content, created_at, user_id")
    .eq("recipe_id", id)
    .order("created_at", { ascending: false });

  const commentUserIds = [
    ...new Set((commentsRaw ?? []).map((c) => c.user_id).filter(Boolean)),
  ];
  const { data: commentProfiles } = commentUserIds.length
    ? await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", commentUserIds)
    : { data: [] };

  const commentProfileMap = Object.fromEntries(
    (commentProfiles ?? []).map((p) => [p.user_id, p])
  );

  const comments: Comment[] = (commentsRaw ?? []).map((c) => ({
    ...c,
    author: commentProfileMap[c.user_id] ?? null,
  }));

  return (
    <div className="min-h-screen">
      <Navigation />

      <main style={{ paddingTop: "5rem", paddingBottom: "4rem" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "2rem" }}>
          {/* Back + Edit row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
            <Link
              href="/recipes"
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                color: "#86C540", fontWeight: 600, textDecoration: "none",
              }}
            >
              ← Back to Recipes
            </Link>

            <RecipeOwnerActions
              recipeId={recipe.id}
              recipeUserId={recipe.user_id}
              initialIsPublic={recipe.is_public ?? true}
            />
          </div>

          <RecipeDetail
            recipe={recipe}
            author={author ?? null}
            likeCount={likeCount ?? 0}
          />
          <CommentsSection recipeId={recipe.id} initialComments={comments} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
