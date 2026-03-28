import { createClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { Navigation } from "@/app/components/Navigation/Navigation";
import { Footer } from "@/app/components/Footer/Footer";
import { RecipeDetail } from "./components/RecipeDetail";
import { RecipeOwnerActions } from "./components/RecipeOwnerActions";
import { CommentsSection } from "./components/CommentsSection";
import type { Comment } from "./components/CommentsSection";
import { ChefNotes } from "./components/ChefNotes";
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

  // Parallel fetches: author profile, like count, comments, forked-from info
  const [
    { data: author },
    { count: likeCount },
    { data: commentsRaw },
    forkedFromResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("user_id", recipe.user_id)
      .maybeSingle(),
    supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("recipe_id", id),
    supabase
      .from("comments")
      .select("id, content, created_at, user_id")
      .eq("recipe_id", id)
      .order("created_at", { ascending: false }),
    // Fetch original recipe + its author if this is a fork
    recipe.forked_from
      ? supabase
          .from("recipes")
          .select("id, title, user_id")
          .eq("id", recipe.forked_from)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // Resolve forked-from author username
  let forkedFromInfo: { id: string; title: string; authorUsername: string | null } | null = null;
  if (forkedFromResult.data) {
    const orig = forkedFromResult.data;
    const { data: origAuthor } = await supabase
      .from("profiles")
      .select("username")
      .eq("user_id", orig.user_id)
      .maybeSingle();
    forkedFromInfo = {
      id: orig.id,
      title: orig.title,
      authorUsername: origAuthor?.username ?? null,
    };
  }

  // Comments + author profiles
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
          {/* Back + Owner actions row */}
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
            forkedFromInfo={forkedFromInfo}
          />
          <ChefNotes
            recipe={{
              title: recipe.title,
              description: recipe.description ?? null,
              ingredients: recipe.ingredients ?? null,
              instructions: recipe.instructions ?? null,
            }}
          />
          <CommentsSection recipeId={recipe.id} initialComments={comments} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
