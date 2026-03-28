"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Navigation } from "@/app/components/Navigation/Navigation";
import { Footer } from "@/app/components/Footer/Footer";

interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  cover_image_url: string | null;
  created_at: string;
  recipe_count: number;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/auth/login");
        return;
      }
      const { data } = await supabase
        .from("collections")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const cols = data ?? [];
      const colIds = cols.map((c) => c.id);

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

      setCollections(cols.map((c) => ({ ...c, recipe_count: countMap[c.id] ?? 0 })));
      setLoading(false);
    });
  }, [router]);

  function openModal() {
    setName(""); setDescription(""); setIsPublic(false); setError("");
    setShowModal(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error: err } = await supabase
        .from("collections")
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          is_public: isPublic,
        })
        .select("*")
        .single();
      if (err) throw err;
      setCollections((prev) => [{ ...data, recipe_count: 0 }, ...prev]);
      setShowModal(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <main style={{ paddingTop: "5rem", paddingBottom: "4rem" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "2rem" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
            <div>
              <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#111827", margin: 0 }}>My Cookbooks</h1>
              {!loading && (
                <p style={{ fontSize: "0.9375rem", color: "#6b7280", marginTop: "0.25rem" }}>
                  {collections.length} {collections.length === 1 ? "cookbook" : "cookbooks"}
                </p>
              )}
            </div>
            <button
              onClick={openModal}
              style={{
                padding: "0.625rem 1.25rem", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #86C540, #5DC2D1)",
                color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              + New Cookbook
            </button>
          </div>

          {loading ? (
            <p style={{ color: "#9ca3af", padding: "2rem 0" }}>Loading…</p>
          ) : collections.length === 0 ? (
            <div style={{ textAlign: "center", padding: "5rem 1rem" }}>
              <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>📚</div>
              <p style={{ color: "#374151", fontSize: "1.125rem", fontWeight: 600 }}>No cookbooks yet</p>
              <p style={{ color: "#9ca3af", marginTop: "0.375rem" }}>Save your favourite recipes into themed cookbooks.</p>
              <button
                onClick={openModal}
                style={{
                  marginTop: "1.5rem", padding: "0.625rem 1.5rem", borderRadius: 10,
                  border: "none", background: "linear-gradient(135deg, #86C540, #5DC2D1)",
                  color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
                }}
              >
                Create your first cookbook
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.5rem" }}>
              {collections.map((col) => (
                <CollectionCard key={col.id} collection={col} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* New Collection Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: "1rem",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{
            background: "#fff", borderRadius: 16, padding: "2rem",
            width: "100%", maxWidth: 440,
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", marginBottom: "1.5rem" }}>
              New Cookbook
            </h2>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: "0.375rem" }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Weeknight Dinners"
                  required
                  style={{
                    width: "100%", padding: "0.625rem 0.875rem",
                    border: "2px solid #e5e7eb", borderRadius: 8,
                    fontSize: 14, outline: "none", boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#86C540")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: "0.375rem" }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What's this collection about?"
                  rows={3}
                  style={{
                    width: "100%", padding: "0.625rem 0.875rem",
                    border: "2px solid #e5e7eb", borderRadius: 8,
                    fontSize: 14, outline: "none", resize: "vertical",
                    fontFamily: "inherit", boxSizing: "border-box",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#86C540")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
                />
              </div>
              {/* Public toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: "none", padding: 0,
                    background: isPublic ? "linear-gradient(135deg, #86C540, #5DC2D1)" : "#d1d5db",
                    cursor: "pointer", position: "relative", transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: "absolute", top: 3, left: isPublic ? 23 : 3,
                    width: 18, height: 18, borderRadius: "50%",
                    background: "#fff", transition: "left 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                    display: "block",
                  }} />
                </button>
                <span style={{ fontSize: 13, color: "#374151" }}>
                  {isPublic ? "Public — anyone can view this collection" : "Private — only you can see this"}
                </span>
              </div>
              {error && <p style={{ fontSize: 13, color: "#dc2626", marginBottom: "1rem" }}>{error}</p>}
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1, padding: "0.625rem", border: "1.5px solid #e5e7eb",
                    borderRadius: 8, background: "#fff", color: "#374151",
                    fontWeight: 600, fontSize: 14, cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    flex: 1, padding: "0.625rem",
                    background: "linear-gradient(135deg, #86C540, #5DC2D1)",
                    border: "none", borderRadius: 8, color: "#fff",
                    fontWeight: 600, fontSize: 14,
                    cursor: creating ? "not-allowed" : "pointer",
                    opacity: creating ? 0.7 : 1,
                  }}
                >
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function CollectionCard({ collection }: { collection: Collection }) {
  return (
    <Link href={`/collections/${collection.id}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          borderRadius: 14, overflow: "hidden",
          border: "1.5px solid #e5e7eb", background: "#fff",
          transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
          cursor: "pointer",
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = "translateY(-4px)";
          el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
          el.style.borderColor = "#86C540";
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = "translateY(0)";
          el.style.boxShadow = "none";
          el.style.borderColor = "#e5e7eb";
        }}
      >
        {/* Cover */}
        <div style={{
          height: 130,
          background: collection.cover_image_url
            ? `url(${collection.cover_image_url}) center/cover`
            : "linear-gradient(135deg, #86C540 0%, #5DC2D1 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {!collection.cover_image_url && (
            <span style={{ fontSize: "2.5rem", opacity: 0.65 }}>📚</span>
          )}
        </div>
        {/* Body */}
        <div style={{ padding: "0.875rem 1rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#111827", margin: 0, lineHeight: 1.3 }}>
              {collection.name}
            </h3>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
              background: collection.is_public ? "rgba(134,197,64,0.15)" : "#f3f4f6",
              color: collection.is_public ? "#4a8f15" : "#6b7280",
              flexShrink: 0, textTransform: "uppercase" as const, letterSpacing: "0.04em",
              whiteSpace: "nowrap" as const,
            }}>
              {collection.is_public ? "Public" : "Private"}
            </span>
          </div>
          {collection.description && (
            <p style={{
              fontSize: "0.8rem", color: "#6b7280", marginTop: "0.375rem", marginBottom: 0,
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as const, overflow: "hidden",
            }}>
              {collection.description}
            </p>
          )}
          <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.5rem", marginBottom: 0 }}>
            {collection.recipe_count} {collection.recipe_count === 1 ? "recipe" : "recipes"}
          </p>
        </div>
      </div>
    </Link>
  );
}
