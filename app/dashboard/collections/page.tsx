import { createClient as createServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  cover_image_url: string | null;
  recipe_count: number;
}

export default async function DashboardCollectionsPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: cols } = await supabase
    .from("collections")
    .select("id, name, description, is_public, cover_image_url")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Recipe counts
  const colIds = (cols ?? []).map((c) => c.id);
  const { data: countData } = colIds.length
    ? await supabase
        .from("collection_recipes")
        .select("collection_id")
        .in("collection_id", colIds)
    : { data: [] };

  const countMap = (countData ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.collection_id] = (acc[row.collection_id] ?? 0) + 1;
    return acc;
  }, {});

  const collections: Collection[] = (cols ?? []).map((c) => ({
    ...c,
    recipe_count: countMap[c.id] ?? 0,
  }));

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "2.5rem 2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.625rem", fontWeight: 800, color: "#111827", margin: "0 0 0.2rem", letterSpacing: "-0.02em" }}>
            Cookbooks
          </h1>
          {collections.length > 0 && (
            <p style={{ fontSize: "0.875rem", color: "#9ca3af", margin: 0 }}>
              {collections.length} {collections.length === 1 ? "collection" : "collections"}
            </p>
          )}
        </div>
        <Link
          href="/collections"
          style={{
            padding: "0.5rem 1.125rem", borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: "linear-gradient(135deg, #86C540, #5DC2D1)",
            color: "#fff", textDecoration: "none",
          }}
        >
          + New Cookbook
        </Link>
      </div>

      {collections.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "4rem 2rem",
          background: "#fff", borderRadius: 16,
          border: "1.5px dashed #e5e7eb",
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📖</div>
          <p style={{ color: "#374151", fontWeight: 600, fontSize: "1.125rem", margin: "0 0 0.375rem" }}>
            No cookbooks yet
          </p>
          <p style={{ color: "#9ca3af", margin: "0 0 1.5rem", fontSize: "0.9rem" }}>
            Group your favourite recipes into themed collections.
          </p>
          <Link
            href="/collections"
            style={{
              display: "inline-block", padding: "0.625rem 1.5rem", borderRadius: 10,
              background: "linear-gradient(135deg, #86C540, #5DC2D1)",
              color: "#fff", fontWeight: 600, fontSize: 14, textDecoration: "none",
            }}
          >
            Create your first cookbook
          </Link>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "1.25rem",
        }}>
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/collections/${col.id}`}
              style={{ textDecoration: "none" }}
            >
              <div style={{
                background: "#fff", borderRadius: 14, overflow: "hidden",
                border: "1px solid #e5e7eb",
                transition: "box-shadow 0.2s, border-color 0.2s, transform 0.2s",
              }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.boxShadow = "0 6px 24px rgba(0,0,0,0.08)";
                  el.style.borderColor = "#86C540";
                  el.style.transform = "translateY(-3px)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.boxShadow = "none";
                  el.style.borderColor = "#e5e7eb";
                  el.style.transform = "translateY(0)";
                }}
              >
                {/* Cover */}
                <div style={{
                  height: 110,
                  background: col.cover_image_url
                    ? `url(${col.cover_image_url}) center/cover`
                    : "linear-gradient(135deg, #86C540 0%, #5DC2D1 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {!col.cover_image_url && (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  )}
                </div>
                {/* Body */}
                <div style={{ padding: "0.75rem 0.875rem 0.875rem" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.2rem" }}>
                    <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#111827", margin: 0, lineHeight: 1.3 }}>
                      {col.name}
                    </h3>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 20,
                      background: col.is_public ? "rgba(134,197,64,0.15)" : "#f3f4f6",
                      color: col.is_public ? "#4a8f15" : "#6b7280",
                      flexShrink: 0, textTransform: "uppercase" as const, letterSpacing: "0.05em",
                    }}>
                      {col.is_public ? "Public" : "Private"}
                    </span>
                  </div>
                  {col.description && (
                    <p style={{
                      fontSize: "0.775rem", color: "#6b7280", margin: "0 0 0.375rem",
                      overflow: "hidden", display: "-webkit-box",
                      WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
                    }}>
                      {col.description}
                    </p>
                  )}
                  <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: 0 }}>
                    {col.recipe_count} {col.recipe_count === 1 ? "recipe" : "recipes"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
