"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navigation } from "@/app/components/Navigation/Navigation";
import { Footer } from "@/app/components/Footer/Footer";
import { createClient } from "@/lib/supabase";
import { RecipeCard } from "@/app/components/RecipeCard/RecipeCard";
import type { User } from "@supabase/supabase-js";

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  ingredients: string[] | null;
  is_public: boolean;
}

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([]);

  // form state
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      setUser(user);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setUsername(data.username ?? "");
        setFullName(data.full_name ?? "");
        setBio(data.bio ?? "");
        setAvatarUrl(data.avatar_url ?? null);
      }

      const { data: recipes } = await supabase
        .from("recipes")
        .select("id, title, description, image_url, ingredients, is_public")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setMyRecipes(recipes ?? []);

      setLoading(false);
    });
  }, []);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaveMsg(null);

    try {
      const supabase = createClient();
      let finalAvatarUrl = avatarUrl;

      // Upload avatar if a new file was selected
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        // Bust cache with timestamp so the browser refetches
        finalAvatarUrl = `${data.publicUrl}?t=${Date.now()}`;
        setAvatarUrl(finalAvatarUrl);
        setAvatarFile(null);
        setAvatarPreview(null);
      }

      const updates = {
        username: username.trim() || null,
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: finalAvatarUrl,
        updated_at: new Date().toISOString(),
      };

      if (profile) {
        const { error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("profiles")
          .insert({ ...updates, user_id: user.id });
        if (error) throw error;
      }

      setSaveMsg({ type: "ok", text: "Profile saved!" });
    } catch (err: unknown) {
      setSaveMsg({ type: "err", text: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const displayName = username || user?.email?.split("@")[0] || "";
  const joinedAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main style={{ paddingTop: "5rem" }}>
          <div style={s.centered}><span style={{ color: "#9ca3af", fontSize: 14 }}>Loading…</span></div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main style={{ paddingTop: "5rem" }}>
          <div style={s.centered}>
            <div style={s.avatarCircle(88)}>👤</div>
            <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#111827", marginBottom: 8 }}>Your Profile</h1>
            <p style={{ color: "#6b7280", marginBottom: 36 }}>Sign in to edit your profile.</p>
            <div style={{ display: "flex", gap: 12 }}>
              <Link href="/auth/login" style={s.btnPrimary}>Sign in</Link>
              <Link href="/auth/signup" style={s.btnSecondary}>Create account</Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Logged in ──────────────────────────────────────────────────────────────
  const avatarSrc = avatarPreview ?? avatarUrl;

  return (
    <div className="min-h-screen bg-white">
      <style>{`.recipe-card-wrapper:hover .edit-overlay { opacity: 1 !important; }`}</style>
      <Navigation />
      <main style={{ paddingTop: "5rem", paddingBottom: "4rem" }}>
        <div style={{ maxWidth: "42rem", margin: "0 auto", padding: "3rem 1.5rem" }}>

          {/* Page title */}
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: 8 }}>
            My Profile
          </h1>
          <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 32 }}>
            Member since {joinedAt} · {user.email}
          </p>

          <form onSubmit={handleSave}>

            {/* ── Avatar ─────────────────────────────────────────────────── */}
            <div style={{ ...s.card, display: "flex", alignItems: "center", gap: 24, marginBottom: 16 }}>
              {/* Clickable avatar */}
              <div
                onClick={() => avatarInputRef.current?.click()}
                style={{
                  position: "relative", flexShrink: 0,
                  width: 88, height: 88, borderRadius: "50%",
                  cursor: "pointer", overflow: "hidden",
                  background: "linear-gradient(135deg, #86C540, #5DC2D1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: 32,
                  boxShadow: "0 2px 12px rgba(134,197,64,0.3)",
                }}
              >
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarSrc} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  displayName.charAt(0).toUpperCase() || "?"
                )}
                {/* Hover overlay */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: "rgba(0,0,0,0.45)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: 0, transition: "opacity 0.2s",
                  fontSize: 11, color: "#fff", fontWeight: 600, textAlign: "center",
                  lineHeight: 1.3,
                }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
                >
                  Change<br />photo
                </div>
              </div>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
              />

              <div>
                <div style={{ fontWeight: 600, color: "#111827", fontSize: 16, marginBottom: 4 }}>
                  {displayName || "Your name"}
                </div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  style={{ fontSize: 13, color: "#86C540", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  {avatarSrc ? "Change photo" : "Upload photo"}
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                    style={{ fontSize: 13, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", marginLeft: 12 }}
                  >
                    Remove
                  </button>
                )}
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>JPG, PNG or WebP · max 5 MB</p>
              </div>
            </div>

            {/* ── Fields ──────────────────────────────────────────────────── */}
            <div style={s.card}>
              <Field label="Username">
                <input
                  style={s.input}
                  type="text"
                  placeholder="e.g. chefmario"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </Field>
              <Field label="Full name">
                <input
                  style={s.input}
                  type="text"
                  placeholder="e.g. Mario Rossi"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                />
              </Field>
              <Field label="Bio" last>
                <textarea
                  style={{ ...s.input, resize: "vertical", minHeight: 80 }}
                  placeholder="Tell the community a bit about yourself…"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                />
              </Field>
            </div>

            {/* Save message */}
            {saveMsg && (
              <div style={{
                padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 12,
                background: saveMsg.type === "ok" ? "#f0fdf4" : "#fef2f2",
                border: `1px solid ${saveMsg.type === "ok" ? "#bbf7d0" : "#fecaca"}`,
                color: saveMsg.type === "ok" ? "#166534" : "#dc2626",
              }}>
                {saveMsg.type === "ok" ? "✓ " : "⚠ "}{saveMsg.text}
              </div>
            )}

            <button type="submit" disabled={saving} style={s.btnSubmit}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>

          {/* ── My Recipes ───────────────────────────────────────────────── */}
          <div style={{ marginTop: 40 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827" }}>
                My Recipes ({myRecipes.length})
              </h2>
              <Link
                href="/recipes/new"
                style={{
                  padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: "linear-gradient(135deg, #86C540, #5DC2D1)",
                  color: "#fff", textDecoration: "none",
                }}
              >
                + New Recipe
              </Link>
            </div>

            {myRecipes.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "3rem 1.5rem",
                background: "#fafafa", borderRadius: 16, border: "1.5px dashed #e5e7eb",
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🍳</div>
                <p style={{ color: "#6b7280", marginBottom: 16 }}>You haven&apos;t shared any recipes yet.</p>
                <Link href="/recipes/new" style={s.btnPrimary}>Share your first recipe</Link>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "1.25rem",
              }}>
                {myRecipes.map((recipe) => (
                  <div key={recipe.id} style={{ position: "relative" }} className="recipe-card-wrapper">
                    <RecipeCard recipe={recipe} />
                    {/* Private badge */}
                    {!recipe.is_public && (
                      <div style={{
                        position: "absolute", top: 8, left: 8,
                        background: "rgba(17,24,39,0.7)", color: "#fff",
                        borderRadius: 6, padding: "3px 9px",
                        fontSize: 11, fontWeight: 700,
                        display: "flex", alignItems: "center", gap: "0.3rem",
                        backdropFilter: "blur(4px)",
                        pointerEvents: "none",
                      }}>
                        🔒 Private
                      </div>
                    )}
                    <Link
                      href={`/recipes/${recipe.id}/edit`}
                      style={{
                        position: "absolute", top: 10, right: 10,
                        padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                        background: "rgba(255,255,255,0.92)", color: "#374151",
                        textDecoration: "none", border: "1px solid #e5e7eb",
                        opacity: 0, transition: "opacity 0.2s",
                        pointerEvents: "auto",
                      }}
                      className="edit-overlay"
                    >
                      ✏️ Edit
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sign out */}
          <button onClick={handleSignOut} style={{ ...s.signOutBtn, marginTop: 40 }}>Sign out</button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Field({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ marginBottom: last ? 0 : 20 }}>
      <label style={s.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

const s = {
  centered: {
    display: "flex", flexDirection: "column" as const,
    alignItems: "center", justifyContent: "center",
    minHeight: "60vh", padding: "2rem 1.5rem", textAlign: "center" as const,
  },
  avatarCircle: (size: number) => ({
    width: size, height: size, borderRadius: "50%",
    background: "linear-gradient(135deg, #86C540, #5DC2D1)",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 20, color: "white", fontWeight: 700, fontSize: size * 0.4,
  }),
  btnPrimary: {
    display: "inline-block", padding: "12px 28px",
    background: "linear-gradient(135deg, #86C540, #5DC2D1)",
    color: "#fff", fontWeight: 600, fontSize: 15, borderRadius: 10, textDecoration: "none",
  } as React.CSSProperties,
  btnSecondary: {
    display: "inline-block", padding: "12px 28px",
    background: "#f3f4f6", color: "#374151",
    fontWeight: 600, fontSize: 15, borderRadius: 10, textDecoration: "none",
  } as React.CSSProperties,
  card: {
    background: "#fff", border: "1px solid #f3f4f6",
    borderRadius: 16, padding: "24px 28px", marginBottom: 16,
    boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
  },
  fieldLabel: {
    display: "block", fontSize: 12, fontWeight: 700,
    color: "#374151", letterSpacing: "0.05em",
    textTransform: "uppercase" as const, marginBottom: 6,
  },
  input: {
    width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 10,
    padding: "11px 14px", fontSize: 14, color: "#111827",
    outline: "none", background: "#fafafa", fontFamily: "inherit",
    boxSizing: "border-box" as const,
  },
  btnSubmit: {
    width: "100%", padding: 14, border: "none", borderRadius: 10,
    background: "linear-gradient(135deg, #86C540, #5DC2D1)",
    color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer",
    boxShadow: "0 4px 12px rgba(134,197,64,0.25)",
  },
  sectionLabel: {
    fontSize: 12, fontWeight: 700, color: "#9ca3af",
    letterSpacing: "0.07em", textTransform: "uppercase" as const, marginBottom: 12,
  },
  actionLink: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "13px 0", borderBottom: "1px solid #f3f4f6",
    textDecoration: "none", color: "#111827", fontSize: 14, fontWeight: 500,
  } as React.CSSProperties,
  signOutBtn: {
    width: "100%", padding: 13, marginTop: 16,
    background: "#fff", border: "1.5px solid #fecaca",
    borderRadius: 10, color: "#dc2626", fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
};
