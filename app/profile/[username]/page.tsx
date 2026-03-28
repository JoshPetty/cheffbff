import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Navigation } from "@/app/components/Navigation/Navigation";
import { Footer } from "@/app/components/Footer/Footer";
import { RecipeCard } from "@/app/components/RecipeCard/RecipeCard";
import { FollowButton } from "./FollowButton";

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  ingredients: string[] | null;
  forked_from: string | null;
  fork_count: number;
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, username, full_name, bio, avatar_url")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, title, description, image_url, ingredients, forked_from, fork_count")
    .eq("user_id", profile.user_id)
    .order("created_at", { ascending: false });

  const recipeList: Recipe[] = recipes ?? [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === profile.user_id;

  // Follower / following counts
  const [{ count: followerCount }, { count: followingCount }] =
    await Promise.all([
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profile.user_id),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", profile.user_id),
    ]);

  // Initial follow state for current viewer
  let initialFollowing = false;
  if (user && !isOwner) {
    const { data: followRow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", profile.user_id)
      .maybeSingle();
    initialFollowing = !!followRow;
  }

  const displayName = profile.username ?? "Anonymous";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main style={{ paddingTop: "5rem", paddingBottom: "4rem" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "3rem 2rem" }}>

          {/* Profile header */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: "2rem",
            flexWrap: "wrap", marginBottom: "3rem",
          }}>
            {/* Avatar */}
            <div style={{
              width: 96, height: 96, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #86C540, #5DC2D1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 36,
              boxShadow: "0 4px 16px rgba(134,197,64,0.3)",
              overflow: "hidden",
            }}>
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                initial
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "1rem",
                flexWrap: "wrap", marginBottom: 6,
              }}>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                  {profile.full_name ?? displayName}
                </h1>
                {profile.full_name && (
                  <span style={{ fontSize: "1rem", color: "#9ca3af", fontWeight: 500 }}>
                    @{profile.username}
                  </span>
                )}
                {isOwner && (
                  <Link
                    href="/profile"
                    style={{
                      padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                      border: "1.5px solid #86C540", color: "#86C540", textDecoration: "none",
                    }}
                  >
                    Edit Profile
                  </Link>
                )}
              </div>

              {/* Follow button — only for non-owners */}
              {!isOwner && (
                <div style={{ marginBottom: 10 }}>
                  <FollowButton
                    profileUserId={profile.user_id}
                    initialFollowerCount={followerCount ?? 0}
                    initialFollowing={initialFollowing}
                  />
                </div>
              )}

              {profile.bio && (
                <p style={{ fontSize: "1rem", color: "#6b7280", margin: 0, maxWidth: "40rem" }}>
                  {profile.bio}
                </p>
              )}
              <div style={{ display: "flex", gap: "1.25rem", marginTop: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>
                  <strong style={{ color: "#111827" }}>{followerCount ?? 0}</strong> followers
                </span>
                <span style={{ fontSize: 13, color: "#6b7280" }}>
                  <strong style={{ color: "#111827" }}>{followingCount ?? 0}</strong> following
                </span>
                <span style={{ fontSize: 13, color: "#6b7280" }}>
                  <strong style={{ color: "#111827" }}>{recipeList.length}</strong>{" "}
                  {recipeList.length === 1 ? "recipe" : "recipes"}
                </span>
              </div>
            </div>
          </div>

          {/* Recipes grid */}
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", marginBottom: "1.5rem" }}>
              Recipes ({recipeList.length})
            </h2>

            {recipeList.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "4rem 2rem",
                background: "#fafafa", borderRadius: 16, border: "1.5px dashed #e5e7eb",
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🍳</div>
                <p style={{ color: "#6b7280" }}>No recipes shared yet.</p>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1.5rem",
              }}>
                {recipeList.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
