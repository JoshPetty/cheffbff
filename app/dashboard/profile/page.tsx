import { createClient as createServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { RecipeCard } from "@/app/components/RecipeCard/RecipeCard";

export default async function DashboardProfilePage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Fetch profile + stats in parallel
  const [
    { data: profile },
    { data: recipesData },
    { count: followerCount },
    { count: followingCount },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, full_name, bio, avatar_url")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("recipes")
      .select("id, title, description, image_url, ingredients, is_public, category, cook_time")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", user.id),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", user.id),
  ]);

  const displayName = profile?.username ?? profile?.full_name ?? user.email?.split("@")[0] ?? "Chef";
  const initial = displayName.charAt(0).toUpperCase();
  const recipes = recipesData ?? [];

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "2.5rem 2rem" }}>
      {/* Profile card */}
      <div style={{
        background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb",
        padding: "1.75rem 2rem", marginBottom: "2rem",
        display: "flex", alignItems: "flex-start", gap: "1.5rem", flexWrap: "wrap",
      }}>
        {/* Avatar */}
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={displayName}
            style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: 80, height: 80, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #86C540, #5DC2D1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 30,
          }}>
            {initial}
          </div>
        )}

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 800, color: "#111827", margin: "0 0 0.25rem", letterSpacing: "-0.02em" }}>
            {displayName}
          </h1>
          {profile?.bio && (
            <p style={{ fontSize: "0.9rem", color: "#6b7280", margin: "0 0 0.875rem", lineHeight: 1.5 }}>
              {profile.bio}
            </p>
          )}

          {/* Stats */}
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <div style={{ textAlign: "center" as const }}>
              <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "#111827" }}>{recipes.length}</div>
              <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Recipes</div>
            </div>
            <div style={{ textAlign: "center" as const }}>
              <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "#111827" }}>{followerCount}</div>
              <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Followers</div>
            </div>
            <div style={{ textAlign: "center" as const }}>
              <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "#111827" }}>{followingCount}</div>
              <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Following</div>
            </div>
          </div>
        </div>

        {/* Edit button */}
        <Link
          href="/profile"
          style={{
            padding: "0.5rem 1.125rem", borderRadius: 8, fontSize: 13, fontWeight: 600,
            border: "1.5px solid #e5e7eb", color: "#374151",
            textDecoration: "none", flexShrink: 0,
            transition: "border-color 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "#86C540")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
        >
          Edit Profile
        </Link>
      </div>

      {/* Recipes */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#111827", margin: 0 }}>
          My Recipes <span style={{ color: "#9ca3af", fontWeight: 500, fontSize: "0.9rem" }}>({recipes.length})</span>
        </h2>
        <Link
          href="/recipes/new"
          style={{
            padding: "0.4rem 1rem", borderRadius: 7, fontSize: 12, fontWeight: 600,
            background: "linear-gradient(135deg, #86C540, #5DC2D1)",
            color: "#fff", textDecoration: "none",
          }}
        >
          + New Recipe
        </Link>
      </div>

      {recipes.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "3.5rem 1.5rem",
          background: "#fff", borderRadius: 14,
          border: "1.5px dashed #e5e7eb",
        }}>
          <p style={{ color: "#9ca3af", margin: "0 0 1rem", fontSize: "0.9rem" }}>
            You haven&apos;t posted any recipes yet.
          </p>
          <Link
            href="/recipes/new"
            style={{
              display: "inline-block", padding: "0.5rem 1.25rem", borderRadius: 8,
              background: "linear-gradient(135deg, #86C540, #5DC2D1)",
              color: "#fff", fontWeight: 600, fontSize: 13, textDecoration: "none",
            }}
          >
            Add your first recipe
          </Link>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "1.25rem",
        }}>
          {recipes.map((recipe) => (
            <div key={recipe.id} style={{ position: "relative" }}>
              <RecipeCard recipe={recipe} />
              {!recipe.is_public && (
                <div style={{
                  position: "absolute", top: 8, left: 8,
                  background: "rgba(17,24,39,0.7)", color: "#fff",
                  borderRadius: 6, padding: "3px 9px",
                  fontSize: 11, fontWeight: 700,
                  pointerEvents: "none" as const,
                  backdropFilter: "blur(4px)",
                }}>
                  Private
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
