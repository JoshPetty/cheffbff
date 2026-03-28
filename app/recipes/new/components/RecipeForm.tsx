"use client";

// Migration: ALTER TABLE recipes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "./styles";
import { IngredientRow } from "@/app/recipes/IngredientRow";
import {
  type IngredientField,
  emptyIngredient,
  formatIngredient,
  parseIngredient,
} from "@/app/recipes/ingredientUtils";

interface ForkData {
  originalId: string;
  originalTitle: string;
  originalAuthor: string | null;
  title: string;
  description: string | null;
  ingredients: string[];
  instructions: string[];
  category: string | null;
  cook_time: number | null;
  prep_time: number | null;
  servings: number | null;
}

export function RecipeForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [servings, setServings] = useState("");
  const [ingredients, setIngredients] = useState<IngredientField[]>([emptyIngredient()]);
  const [instructions, setInstructions] = useState<string[]>([""]);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // ── URL import state ──────────────────────────────────────────────────────
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);

  // ── Fork state ────────────────────────────────────────────────────────────
  const [forkData, setForkData] = useState<ForkData | null>(null);

  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login");
      } else {
        setUserEmail(user.email ?? null);
        setUserId(user.id);
      }
    });

    // ── Detect fork data from sessionStorage ────────────────────────────────
    const raw = sessionStorage.getItem("chefbff_fork");
    if (raw) {
      try {
        const fork: ForkData = JSON.parse(raw);
        sessionStorage.removeItem("chefbff_fork");
        setForkData(fork);
        setTitle(`My version of ${fork.title}`);
        if (fork.description) setDescription(fork.description);
        if (fork.category) setCategory(fork.category);
        if (fork.cook_time != null) setCookTime(String(fork.cook_time));
        if (fork.prep_time != null) setPrepTime(String(fork.prep_time));
        if (fork.servings != null) setServings(String(fork.servings));
        if (fork.ingredients.length > 0)
          setIngredients(fork.ingredients.map((s) => parseIngredient(String(s))));
        if (fork.instructions.length > 0)
          setInstructions(fork.instructions.map(String));
      } catch {
        // malformed data — ignore
      }
    }
  }, [router]);

  async function handleImport() {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError("");
    setImportSuccess(false);
    try {
      const res = await fetch("/api/import-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error ?? "Import failed");
        return;
      }
      // Pre-fill form fields
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.category) setCategory(data.category);
      if (data.cook_time != null) setCookTime(String(data.cook_time));
      if (data.prep_time != null) setPrepTime(String(data.prep_time));
      if (data.servings != null) setServings(String(data.servings));
      if (Array.isArray(data.ingredients) && data.ingredients.length > 0) {
        setIngredients(data.ingredients.map((s: string) => parseIngredient(String(s))));
      }
      if (Array.isArray(data.instructions) && data.instructions.length > 0) {
        setInstructions(data.instructions.map(String));
      }
      setImportSuccess(true);
    } catch {
      setImportError("Something went wrong. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  function addIngredient() {
    setIngredients([...ingredients, emptyIngredient()]);
  }

  function updateIngredient(index: number, field: IngredientField) {
    const next = [...ingredients];
    next[index] = field;
    setIngredients(next);
  }

  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function addInstruction() {
    setInstructions([...instructions, ""]);
  }

  function updateInstruction(index: number, value: string) {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  }

  function removeInstruction(index: number) {
    setInstructions(instructions.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      let imageUrl = null;

      if (image) {
        setUploading(true);
        setUploadProgress(30);
        const fileExt = image.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("recipe-images")
          .upload(filePath, image, { upsert: true });

        setUploadProgress(80);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("recipe-images")
          .getPublicUrl(filePath);

        imageUrl = data.publicUrl;
        setUploadProgress(100);
        setUploading(false);
      }

      const cleanIngredients = ingredients
        .map(formatIngredient)
        .filter((s) => s.trim() !== "");
      const cleanInstructions = instructions.filter((i) => i.trim() !== "");

      const { error: insertError } = await supabase.from("recipes").insert({
        title,
        description,
        ingredients: cleanIngredients,
        instructions: cleanInstructions,
        image_url: imageUrl,
        user_id: user.id,
        category: category || null,
        cook_time: cookTime ? parseInt(cookTime, 10) : null,
        prep_time: prepTime ? parseInt(prepTime, 10) : null,
        servings: servings ? parseInt(servings, 10) : null,
        forked_from: forkData?.originalId ?? null,
      });

      if (insertError) throw insertError;

      // Increment fork_count on the original recipe
      if (forkData?.originalId) {
        const { data: orig } = await supabase
          .from("recipes")
          .select("fork_count")
          .eq("id", forkData.originalId)
          .single();
        await supabase
          .from("recipes")
          .update({ fork_count: (orig?.fork_count ?? 0) + 1 })
          .eq("id", forkData.originalId);
      }

      router.push("/recipes");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <Container>
      {userEmail && (
        <p className="text-sm text-gray-500 mb-6">
          Posting as <span className="font-medium text-orange-500">{userEmail}</span>
        </p>
      )}

      {/* ── Fork banner ─────────────────────────────────────────────────── */}
      {forkData && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          background: "rgba(134,197,64,0.08)",
          border: "1.5px solid rgba(134,197,64,0.3)",
          borderRadius: 10, padding: "0.75rem 1rem",
          marginBottom: "1.25rem", flexWrap: "wrap",
          fontSize: 14,
        }}>
          <span>🍴</span>
          <span style={{ color: "#374151" }}>Forking</span>
          <Link
            href={`/recipes/${forkData.originalId}`}
            style={{ fontWeight: 700, color: "#4a8f15", textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
          >
            {forkData.originalTitle}
          </Link>
          {forkData.originalAuthor && (
            <>
              <span style={{ color: "#6b7280" }}>by</span>
              <Link
                href={`/profile/${forkData.originalAuthor}`}
                style={{ fontWeight: 600, color: "#4a8f15", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
              >
                {forkData.originalAuthor}
              </Link>
            </>
          )}
          <span style={{ color: "#6b7280", marginLeft: "auto", fontSize: 12 }}>
            Edit freely — your version will be saved separately
          </span>
        </div>
      )}

      {/* ── Import from URL ─────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(134,197,64,0.07), rgba(93,194,209,0.07))",
        border: "1.5px solid rgba(134,197,64,0.25)",
        borderRadius: 12, padding: "1.125rem 1.25rem", marginBottom: "1.75rem",
      }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: "0 0 0.625rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          🔗 Import recipe from a URL
        </p>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="url"
            value={importUrl}
            onChange={e => { setImportUrl(e.target.value); setImportError(""); setImportSuccess(false); }}
            placeholder="https://www.example.com/my-recipe"
            disabled={importing}
            style={{
              flex: 1, padding: "0.5rem 0.75rem",
              border: "1.5px solid #e5e7eb", borderRadius: 8,
              fontSize: 13, outline: "none", fontFamily: "inherit",
              background: importing ? "#f9fafb" : "#fff",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "#86C540")}
            onBlur={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleImport(); } }}
          />
          <button
            type="button"
            onClick={handleImport}
            disabled={importing || !importUrl.trim()}
            style={{
              padding: "0.5rem 1.125rem",
              background: importing || !importUrl.trim()
                ? "#e5e7eb"
                : "linear-gradient(135deg, #86C540, #5DC2D1)",
              color: importing || !importUrl.trim() ? "#9ca3af" : "#fff",
              border: "none", borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: importing || !importUrl.trim() ? "not-allowed" : "pointer",
              whiteSpace: "nowrap" as const, transition: "opacity 0.2s",
            }}
          >
            {importing ? "Importing…" : "Import"}
          </button>
        </div>
        {importing && (
          <p style={{ fontSize: 12, color: "#6b7280", margin: "0.5rem 0 0", display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⏳</span>
            Fetching and extracting recipe…
          </p>
        )}
        {importSuccess && !importError && (
          <p style={{ fontSize: 12, color: "#4a8f15", fontWeight: 600, margin: "0.5rem 0 0" }}>
            ✓ Recipe imported! Review and edit the fields below before publishing.
          </p>
        )}
        {importError && (
          <p style={{ fontSize: 12, color: "#dc2626", margin: "0.5rem 0 0" }}>
            ⚠ {importError}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="recipe-form">
        {/* Title */}
        <div className="form-group">
          <label className="form-label">Recipe Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
            placeholder="e.g., Grandma's Chocolate Chip Cookies"
            required
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-textarea"
            placeholder="Tell us about this recipe..."
            rows={3}
          />
        </div>

        {/* Category + Times + Servings row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem" }} className="form-group">
          <div>
            <label className="form-label">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="form-input"
              style={{ cursor: "pointer" }}
            >
              <option value="">— select —</option>
              {["Breakfast","Lunch","Dinner","Dessert","Snack","Soup","Salad","Baking","Vegetarian","Vegan"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Prep time (min)</label>
            <input
              type="number"
              min={0}
              value={prepTime}
              onChange={e => setPrepTime(e.target.value)}
              className="form-input"
              placeholder="e.g. 15"
            />
          </div>
          <div>
            <label className="form-label">Cook time (min)</label>
            <input
              type="number"
              min={0}
              value={cookTime}
              onChange={e => setCookTime(e.target.value)}
              className="form-input"
              placeholder="e.g. 30"
            />
          </div>
          <div>
            <label className="form-label">Servings</label>
            <input
              type="number"
              min={1}
              value={servings}
              onChange={e => setServings(e.target.value)}
              className="form-input"
              placeholder="e.g. 4"
            />
          </div>
        </div>

        {/* Ingredients */}
        <div className="form-group">
          <label className="form-label">Ingredients *</label>
          <div style={{ display: "flex", gap: "0.25rem", fontSize: 11, color: "#9ca3af", marginBottom: "0.5rem" }}>
            <span style={{ width: 70, flexShrink: 0, textAlign: "center" }}>Amount</span>
            <span style={{ width: 120, flexShrink: 0 }}>Unit</span>
            <span>Name</span>
          </div>
          {ingredients.map((field, index) => (
            <IngredientRow
              key={index}
              field={field}
              onChange={(f) => updateIngredient(index, f)}
              onRemove={() => removeIngredient(index)}
              showRemove={ingredients.length > 1}
            />
          ))}
          <button
            type="button"
            onClick={addIngredient}
            className="add-button"
          >
            + Add Ingredient
          </button>
        </div>

        {/* Instructions */}
        <div className="form-group">
          <label className="form-label">Instructions *</label>
          {instructions.map((instruction, index) => (
            <div key={index} className="dynamic-field with-number">
              <span className="step-number">{index + 1}</span>
              <textarea
                value={instruction}
                onChange={(e) => updateInstruction(index, e.target.value)}
                className="form-textarea"
                placeholder="Describe this step..."
                rows={2}
              />
              {instructions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeInstruction(index)}
                  className="remove-button"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addInstruction}
            className="add-button"
          >
            + Add Step
          </button>
        </div>

        {/* Image Upload */}
        <div className="form-group">
          <label className="form-label">Recipe Image</label>

          {/* Preview */}
          {imagePreview && (
            <div style={{ marginBottom: "0.75rem", position: "relative", borderRadius: "0.5rem", overflow: "hidden", maxHeight: 220 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Preview"
                style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }}
              />
              <button
                type="button"
                onClick={() => { setImage(null); setImagePreview(null); setUploadProgress(0); }}
                style={{
                  position: "absolute", top: 8, right: 8,
                  background: "rgba(0,0,0,0.55)", color: "#fff",
                  border: "none", borderRadius: "50%",
                  width: 28, height: 28, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setImage(file);
              setUploadProgress(0);
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setImagePreview(reader.result as string);
                reader.readAsDataURL(file);
              } else {
                setImagePreview(null);
              }
            }}
            className="form-file"
          />

          {/* Upload progress bar */}
          {uploading && (
            <div style={{ marginTop: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                <span>Uploading image…</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ height: 4, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 4,
                  background: "linear-gradient(135deg, #86C540, #5DC2D1)",
                  width: `${uploadProgress}%`,
                  transition: "width 0.3s ease",
                }} />
              </div>
            </div>
          )}
          {!uploading && uploadProgress === 100 && (
            <p style={{ fontSize: 12, color: "#86C540", marginTop: 4, fontWeight: 500 }}>✓ Image ready</p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || uploading}
          className="submit-button"
        >
          {uploading ? "Uploading image…" : loading ? "Creating…" : "New Recipe"}
        </button>
      </form>
    </Container>
  );
}
