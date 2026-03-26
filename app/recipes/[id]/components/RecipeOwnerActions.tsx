"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

interface RecipeOwnerActionsProps {
  recipeId: string;
  recipeUserId: string;
  initialIsPublic: boolean;
}

export function RecipeOwnerActions({
  recipeId,
  recipeUserId,
  initialIsPublic,
}: RecipeOwnerActionsProps) {
  const [isOwner, setIsOwner] = useState(false);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [toggling, setToggling] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsOwner(!!user && user.id === recipeUserId);
    });
  }, [recipeUserId]);

  if (!isOwner) return null;

  async function togglePrivacy() {
    setToggling(true);
    const supabase = createClient();
    const next = !isPublic;
    const { error } = await supabase
      .from("recipes")
      .update({ is_public: next })
      .eq("id", recipeId);
    if (!error) setIsPublic(next);
    setToggling(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("recipes").delete().eq("id", recipeId);
    router.push("/recipes");
  }

  const btnBase: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: "0.35rem",
    padding: "0.5rem 1rem", borderRadius: 8,
    fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer",
    transition: "background 0.15s, border-color 0.15s",
    whiteSpace: "nowrap",
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        {/* Edit */}
        <Link
          href={`/recipes/${recipeId}/edit`}
          style={{
            ...btnBase,
            background: "linear-gradient(135deg, #86C540, #5DC2D1)",
            color: "#fff", border: "none", textDecoration: "none",
            boxShadow: "0 2px 8px rgba(134,197,64,0.25)",
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          ✏️ Edit
        </Link>

        {/* Privacy toggle */}
        <button
          onClick={togglePrivacy}
          disabled={toggling}
          style={{
            ...btnBase,
            background: isPublic ? "#fff" : "rgba(134,197,64,0.08)",
            border: isPublic ? "1.5px solid #e5e7eb" : "1.5px solid #86C540",
            color: isPublic ? "#374151" : "#4a8f15",
            opacity: toggling ? 0.6 : 1,
          }}
          onMouseEnter={e => {
            if (!toggling) e.currentTarget.style.borderColor = "#86C540";
          }}
          onMouseLeave={e => {
            if (!toggling)
              e.currentTarget.style.borderColor = isPublic ? "#e5e7eb" : "#86C540";
          }}
        >
          {isPublic ? "🔒 Make Private" : "🔓 Make Public"}
        </button>

        {/* Delete */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          style={{
            ...btnBase,
            background: "#fff",
            border: "1.5px solid #fecaca",
            color: "#dc2626",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#fef2f2")}
          onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
        >
          🗑️ Delete
        </button>
      </div>

      {/* ── Delete confirmation modal ──────────────────────────────────── */}
      {showDeleteConfirm && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: "1rem",
          }}
          onClick={e => { if (!deleting && e.target === e.currentTarget) setShowDeleteConfirm(false); }}
        >
          <div style={{
            background: "#fff", borderRadius: 16, padding: "2rem",
            width: "100%", maxWidth: 400,
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🗑️</div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>
              Delete this recipe?
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1.5rem" }}>
              This cannot be undone. The recipe will be permanently removed.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                style={{
                  flex: 1, padding: "0.625rem",
                  border: "1.5px solid #e5e7eb", borderRadius: 8,
                  background: "#fff", color: "#374151",
                  fontWeight: 600, fontSize: 14, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  flex: 1, padding: "0.625rem",
                  background: "#dc2626", border: "none", borderRadius: 8,
                  color: "#fff", fontWeight: 600, fontSize: 14,
                  cursor: deleting ? "not-allowed" : "pointer",
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
