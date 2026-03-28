"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Container } from "@/app/recipes/new/components/styles";
import { IngredientRow } from "@/app/recipes/IngredientRow";
import {
  type IngredientField,
  emptyIngredient,
  parseIngredient,
  formatIngredient,
} from "@/app/recipes/ingredientUtils";

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  ingredients: string[] | null;
  instructions: string[] | null;
  image_url: string | null;
  user_id: string;
  category: string | null;
  cook_time: number | null;
  prep_time: number | null;
  servings: number | null;
}

export function EditRecipeForm({ recipe }: { recipe: Recipe }) {
  const [title, setTitle] = useState(recipe.title);
  const [description, setDescription] = useState(recipe.description ?? "");
  const [category, setCategory] = useState(recipe.category ?? "");
  const [cookTime, setCookTime] = useState(recipe.cook_time?.toString() ?? "");
  const [prepTime, setPrepTime] = useState(recipe.prep_time?.toString() ?? "");
  const [servings, setServings] = useState(recipe.servings?.toString() ?? "");
  const [ingredients, setIngredients] = useState<IngredientField[]>(
    recipe.ingredients?.length
      ? recipe.ingredients.map(parseIngredient)
      : [emptyIngredient()]
  );
  const [instructions, setInstructions] = useState<string[]>(recipe.instructions?.length ? recipe.instructions : [""]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(recipe.image_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Auth guard — redirect if not the owner
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || user.id !== recipe.user_id) {
        router.replace(`/recipes/${recipe.id}`);
      }
    });
  }, [recipe.id, recipe.user_id, router]);

  // ── Ingredients helpers ────────────────────────────────────────────────────
  const addIngredient = () => setIngredients([...ingredients, emptyIngredient()]);
  const updateIngredient = (i: number, field: IngredientField) => {
    const next = [...ingredients]; next[i] = field; setIngredients(next);
  };
  const removeIngredient = (i: number) => setIngredients(ingredients.filter((_, idx) => idx !== i));

  // ── Instructions helpers ───────────────────────────────────────────────────
  const addInstruction = () => setInstructions([...instructions, ""]);
  const updateInstruction = (i: number, v: string) => {
    const next = [...instructions]; next[i] = v; setInstructions(next);
  };
  const removeInstruction = (i: number) => setInstructions(instructions.filter((_, idx) => idx !== i));

  // ── Image selection ────────────────────────────────────────────────────────
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setUploadProgress(0);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(recipe.image_url ?? null);
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== recipe.user_id) {
        router.replace(`/recipes/${recipe.id}`);
        return;
      }

      let imageUrl = recipe.image_url;

      if (imageFile) {
        setUploading(true);
        setUploadProgress(30);
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("recipe-images")
          .upload(path, imageFile, { upsert: true });

        setUploadProgress(80);
        if (uploadErr) throw uploadErr;

        const { data } = supabase.storage.from("recipe-images").getPublicUrl(path);
        imageUrl = data.publicUrl;
        setUploadProgress(100);
        setUploading(false);
      }

      const { error: updateErr } = await supabase
        .from("recipes")
        .update({
          title,
          description: description || null,
          ingredients: ingredients.map(formatIngredient).filter((s) => s.trim()),
          instructions: instructions.filter(i => i.trim()),
          image_url: imageUrl,
          category: category || null,
          cook_time: cookTime ? parseInt(cookTime, 10) : null,
          prep_time: prepTime ? parseInt(prepTime, 10) : null,
          servings: servings ? parseInt(servings, 10) : null,
        })
        .eq("id", recipe.id)
        .eq("user_id", user.id); // extra safety check

      if (updateErr) throw updateErr;

      router.push(`/recipes/${recipe.id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
      setUploading(false);
    }
  }

  return (
    <Container>
      <form onSubmit={handleSubmit} className="recipe-form">

        {/* Title */}
        <div className="form-group">
          <label className="form-label">Recipe Title *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
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
            onChange={e => setDescription(e.target.value)}
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
          <button type="button" onClick={addIngredient} className="add-button">
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
                onChange={e => updateInstruction(index, e.target.value)}
                className="form-textarea"
                placeholder="Describe this step..."
                rows={2}
              />
              {instructions.length > 1 && (
                <button type="button" onClick={() => removeInstruction(index)} className="remove-button">
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addInstruction} className="add-button">
            + Add Step
          </button>
        </div>

        {/* Image */}
        <div className="form-group">
          <label className="form-label">Recipe Image</label>

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
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                  setUploadProgress(0);
                }}
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
              {imagePreview === recipe.image_url && (
                <div style={{
                  position: "absolute", bottom: 8, left: 8,
                  background: "rgba(0,0,0,0.5)", color: "#fff",
                  fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                }}>
                  Current image
                </div>
              )}
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="form-file"
          />

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
                  width: `${uploadProgress}%`, transition: "width 0.3s ease",
                }} />
              </div>
            </div>
          )}
          {!uploading && uploadProgress === 100 && (
            <p style={{ fontSize: 12, color: "#86C540", marginTop: 4, fontWeight: 500 }}>✓ Image ready</p>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          type="submit"
          disabled={loading || uploading}
          className="submit-button"
        >
          {uploading ? "Uploading image…" : loading ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </Container>
  );
}
