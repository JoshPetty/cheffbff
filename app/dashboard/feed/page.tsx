import { createClient as createServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

// ── Time-ago helper ────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Types ──────────────────────────────────────────────────────────────────
interface FeedRecipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  user_id: string;
  created_at: string;
  likesCount: number;
  commentsCount: number;
  author: {
    username: string | null;
    avatar_url: string | null;
  } | null;
}

// ── Page ───────────────────────────────────────────────────────────────────
export default async function FeedPage() {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Who does this user follow?
  const { data: followingData } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followingIds = (followingData ?? []).map((f) => f.following_id);

  if (followingIds.length === 0) {
    return <EmptyFollowing />;
  }

  // Recipes from followed users, public only, newest first
  const { data: recipesData } = await supabase
    .from("recipes")
    .select("id, title, description, image_url, user_id, created_at")
    .in("user_id", followingIds)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(50);

  const recipeIds = (recipesData ?? []).map((r) => r.id);
  const authorIds = [...new Set((recipesData ?? []).map((r) => r.user_id))];

  // Parallel: profiles + likes + comments counts
  const [
    { data: profiles },
    { data: likesData },
    { data: commentsData },
  ] = await Promise.all([
    authorIds.length
      ? supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .in("user_id", authorIds)
      : { data: [] },
    recipeIds.length
      ? supabase.from("likes").select("recipe_id").in("recipe_id", recipeIds)
      : { data: [] },
    recipeIds.length
      ? supabase.from("comments").select("recipe_id").in("recipe_id", recipeIds)
      : { data: [] },
  ]);

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.user_id, p])
  );
  const likesMap = (likesData ?? []).reduce<Record<string, number>>(
    (acc, l) => { acc[l.recipe_id] = (acc[l.recipe_id] || 0) + 1; return acc; },
    {}
  );
  const commentsMap = (commentsData ?? []).reduce<Record<string, number>>(
    (acc, c) => { acc[c.recipe_id] = (acc[c.recipe_id] || 0) + 1; return acc; },
    {}
  );

  const recipes: FeedRecipe[] = (recipesData ?? []).map((r) => ({
    ...r,
    author: profileMap[r.user_id] ?? null,
    likesCount: likesMap[r.id] ?? 0,
    commentsCount: commentsMap[r.id] ?? 0,
  }));

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem 1rem 3rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.625rem", fontWeight: 800, color: "#111827", margin: "0 0 0.25rem", letterSpacing: "-0.02em" }}>
          Your Feed
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#9ca3af", margin: 0 }}>
          {recipes.length === 0
            ? "No recipes yet from people you follow"
            : `${recipes.length} new recipe${recipes.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {recipes.length === 0 ? (
        <EmptyNoRecipes />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          {recipes.map((recipe) => (
            <FeedCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Feed card ──────────────────────────────────────────────────────────────
function FeedCard({ recipe }: { recipe: FeedRecipe }) {
  const author = recipe.author;
  const username = author?.username ?? "Chef";
  const initial = username.charAt(0).toUpperCase();

  return (
    <article style={{
      background: "#fff",
      borderRadius: 16,
      border: "1.5px solid #f3f4f6",
      overflow: "hidden",
      boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    }}>
      {/* Author row */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.75rem",
        padding: "0.875rem 1rem 0",
      }}>
        {author?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={author.avatar_url}
            alt={username}
            style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #86C540, #5DC2D1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 16,
          }}>
            {initial}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link
            href={`/profile/${username}`}
            style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#111827", textDecoration: "none" }}
          >
            {username}
          </Link>
          <p style={{ fontSize: "0.8125rem", color: "#9ca3af", margin: 0 }}>
            {timeAgo(recipe.created_at)}
          </p>
        </div>
      </div>

      {/* Recipe image */}
      <Link href={`/recipes/${recipe.id}`} style={{ display: "block", textDecoration: "none", marginTop: "0.875rem" }}>
        {recipe.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.image_url}
            alt={recipe.title}
            style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{
            width: "100%", aspectRatio: "4/3",
            background: "linear-gradient(135deg, rgba(134,197,64,0.12), rgba(93,194,209,0.15))",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: "4rem", opacity: 0.4 }}>🍳</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div style={{ padding: "0.875rem 1rem 1rem" }}>
        {/* Title */}
        <Link href={`/recipes/${recipe.id}`} style={{ textDecoration: "none" }}>
          <h2 style={{
            fontSize: "1.0625rem", fontWeight: 700, color: "#111827",
            margin: "0 0 0.375rem", lineHeight: 1.3,
          }}>
            {recipe.title}
          </h2>
        </Link>

        {/* Description */}
        {recipe.description && (
          <p style={{
            fontSize: "0.875rem", color: "#4b5563", margin: "0 0 0.875rem",
            lineHeight: 1.55,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {recipe.description}
          </p>
        )}

        {/* Footer: counts + view link */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "0.875rem", color: "#6b7280", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{ fontSize: "1rem" }}>♥</span> {recipe.likesCount}
            </span>
            <span style={{ fontSize: "0.875rem", color: "#6b7280", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{ fontSize: "1rem" }}>💬</span> {recipe.commentsCount}
            </span>
          </div>

          <Link
            href={`/recipes/${recipe.id}`}
            style={{
              fontSize: "0.8125rem", fontWeight: 600,
              color: "#86C540", textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: "0.25rem",
            }}
          >
            View Recipe →
          </Link>
        </div>
      </div>
    </article>
  );
}

// ── Empty states ───────────────────────────────────────────────────────────
function EmptyFollowing() {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "2rem 1rem 3rem" }}>
      <h1 style={{ fontSize: "1.625rem", fontWeight: 800, color: "#111827", margin: "0 0 2rem", letterSpacing: "-0.02em" }}>
        Your Feed
      </h1>
      <div style={{
        textAlign: "center", padding: "4rem 2rem",
        background: "#fff", borderRadius: 20,
        border: "1.5px dashed #e5e7eb",
      }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>👨‍🍳</div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", margin: "0 0 0.5rem" }}>
          Your feed is empty
        </h2>
        <p style={{ color: "#6b7280", margin: "0 0 0.375rem", fontSize: "0.9375rem" }}>
          Follow some chefs to see their recipes here.
        </p>
        <p style={{ color: "#9ca3af", margin: "0 0 1.75rem", fontSize: "0.875rem" }}>
          Discover great cooks and get their latest recipes in your feed.
        </p>
        <Link
          href="/recipes"
          style={{
            display: "inline-block",
            padding: "0.75rem 1.75rem", borderRadius: 12,
            background: "linear-gradient(135deg, #86C540, #5DC2D1)",
            color: "#fff", fontWeight: 600, fontSize: 14,
            textDecoration: "none",
            boxShadow: "0 4px 12px rgba(134,197,64,0.25)",
          }}
        >
          Discover Recipes
        </Link>
      </div>
    </div>
  );
}

function EmptyNoRecipes() {
  return (
    <div style={{
      textAlign: "center", padding: "4rem 2rem",
      background: "#fff", borderRadius: 20,
      border: "1.5px dashed #e5e7eb",
    }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🍽️</div>
      <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#111827", margin: "0 0 0.5rem" }}>
        No recipes yet from people you follow
      </h2>
      <p style={{ color: "#9ca3af", margin: "0 0 1.5rem", fontSize: "0.875rem" }}>
        The chefs you follow haven&apos;t posted anything yet.
      </p>
      <Link
        href="/recipes"
        style={{
          display: "inline-block",
          padding: "0.75rem 1.75rem", borderRadius: 12,
          background: "linear-gradient(135deg, #86C540, #5DC2D1)",
          color: "#fff", fontWeight: 600, fontSize: 14,
          textDecoration: "none",
        }}
      >
        Discover Recipes
      </Link>
    </div>
  );
}
