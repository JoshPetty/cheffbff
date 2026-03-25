"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface Collection {
  id: string;
  name: string;
}

interface SaveToCollectionProps {
  recipeId: string;
}

export function SaveToCollection({ recipeId }: SaveToCollectionProps) {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  // New collection inline form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Fetch user + collections + saved state when opened
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data: cols } = await supabase
        .from("collections")
        .select("id, name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const userCols = cols ?? [];
      setCollections(userCols);

      if (userCols.length > 0) {
        const { data: savedData } = await supabase
          .from("collection_recipes")
          .select("collection_id")
          .eq("recipe_id", recipeId)
          .in("collection_id", userCols.map((c) => c.id));
        setSavedIds(new Set((savedData ?? []).map((s) => s.collection_id)));
      } else {
        setSavedIds(new Set());
      }
      setLoading(false);
    });
  }, [open, recipeId]);

  function handleOpenClick() {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setOpen((prev) => !prev);
    });
  }

  async function toggleCollection(colId: string) {
    if (toggling) return;
    setToggling(colId);
    const supabase = createClient();
    const isSaved = savedIds.has(colId);
    if (isSaved) {
      await supabase
        .from("collection_recipes")
        .delete()
        .eq("collection_id", colId)
        .eq("recipe_id", recipeId);
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.delete(colId);
        return next;
      });
    } else {
      await supabase
        .from("collection_recipes")
        .insert({ collection_id: colId, recipe_id: recipeId });
      setSavedIds((prev) => new Set([...prev, colId]));
    }
    setToggling(null);
  }

  async function handleCreateAndSave(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !userId) return;
    setCreating(true);
    const supabase = createClient();
    const { data: newCol, error } = await supabase
      .from("collections")
      .insert({ user_id: userId, name: newName.trim(), is_public: false })
      .select("id, name")
      .single();
    if (!error && newCol) {
      await supabase
        .from("collection_recipes")
        .insert({ collection_id: newCol.id, recipe_id: recipeId });
      setCollections((prev) => [newCol, ...prev]);
      setSavedIds((prev) => new Set([...prev, newCol.id]));
      setNewName("");
      setShowNewForm(false);
    }
    setCreating(false);
  }

  const savedCount = savedIds.size;

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
      {/* Trigger button */}
      <button
        onClick={handleOpenClick}
        title="Save to collection"
        style={{
          display: "inline-flex", alignItems: "center", gap: "0.375rem",
          padding: "0.4rem 0.875rem",
          border: savedCount > 0 ? "1.5px solid #86C540" : "1.5px solid #e5e7eb",
          borderRadius: 20, background: savedCount > 0 ? "rgba(134,197,64,0.1)" : "#fff",
          color: savedCount > 0 ? "#4a8f15" : "#6b7280",
          fontWeight: 600, fontSize: 14, cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => {
          if (savedCount === 0) {
            e.currentTarget.style.borderColor = "#86C540";
            e.currentTarget.style.color = "#4a8f15";
          }
        }}
        onMouseLeave={e => {
          if (savedCount === 0) {
            e.currentTarget.style.borderColor = "#e5e7eb";
            e.currentTarget.style.color = "#6b7280";
          }
        }}
      >
        <span>🔖</span>
        <span>{savedCount > 0 ? `Saved (${savedCount})` : "Save"}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0,
          background: "#fff", borderRadius: 12, minWidth: 240,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          border: "1px solid #e5e7eb", zIndex: 100,
          overflow: "hidden",
        }}>
          <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #f3f4f6" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Save to collection
            </p>
          </div>

          {loading ? (
            <p style={{ padding: "1rem", fontSize: 13, color: "#9ca3af", margin: 0 }}>Loading…</p>
          ) : collections.length === 0 && !showNewForm ? (
            <p style={{ padding: "0.75rem 1rem", fontSize: 13, color: "#9ca3af", margin: 0 }}>
              No collections yet.
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: "0.375rem 0", maxHeight: 220, overflowY: "auto" }}>
              {collections.map((col) => {
                const checked = savedIds.has(col.id);
                return (
                  <li key={col.id}>
                    <button
                      onClick={() => toggleCollection(col.id)}
                      disabled={toggling === col.id}
                      style={{
                        width: "100%", display: "flex", alignItems: "center",
                        gap: "0.625rem", padding: "0.5rem 1rem",
                        background: "none", border: "none", cursor: "pointer",
                        textAlign: "left", fontSize: 14, color: "#111827",
                        transition: "background 0.15s",
                        opacity: toggling === col.id ? 0.6 : 1,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}
                    >
                      {/* Checkbox */}
                      <span style={{
                        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                        border: checked ? "none" : "2px solid #d1d5db",
                        background: checked ? "linear-gradient(135deg, #86C540, #5DC2D1)" : "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s",
                      }}>
                        {checked && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {col.name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* New collection form or button */}
          <div style={{ borderTop: "1px solid #f3f4f6", padding: "0.5rem" }}>
            {showNewForm ? (
              <form onSubmit={handleCreateAndSave} style={{ display: "flex", gap: "0.375rem" }}>
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Collection name"
                  style={{
                    flex: 1, padding: "0.375rem 0.625rem",
                    border: "1.5px solid #e5e7eb", borderRadius: 6,
                    fontSize: 13, outline: "none", fontFamily: "inherit",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#86C540")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
                />
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  style={{
                    padding: "0.375rem 0.75rem", borderRadius: 6, border: "none",
                    background: "linear-gradient(135deg, #86C540, #5DC2D1)",
                    color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer",
                    opacity: creating || !newName.trim() ? 0.6 : 1,
                  }}
                >
                  {creating ? "…" : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNewForm(false); setNewName(""); }}
                  style={{
                    padding: "0.375rem 0.5rem", borderRadius: 6,
                    border: "1.5px solid #e5e7eb", background: "#fff",
                    color: "#6b7280", fontSize: 12, cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowNewForm(true)}
                style={{
                  width: "100%", padding: "0.5rem 0.75rem",
                  background: "none", border: "none", cursor: "pointer",
                  textAlign: "left", fontSize: 13, color: "#86C540",
                  fontWeight: 600, borderRadius: 6,
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                + New collection
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
