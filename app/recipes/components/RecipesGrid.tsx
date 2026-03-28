'use client';

import { RecipeCard } from "@/app/components/RecipeCard/RecipeCard";

interface Author {
  username: string | null;
  avatar_url: string | null;
}

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  ingredients: string[] | null;
  author?: Author | null;
  likesCount?: number;
  commentsCount?: number;
  savesCount?: number;
}

interface RecipesGridProps {
  recipes: Recipe[];
}

export function RecipesGrid({ recipes }: RecipesGridProps) {
  if (recipes.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "5rem 1rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🍳</div>
        <p style={{ color: "#374151", fontWeight: 600, fontSize: "1.125rem" }}>
          No recipes yet!
        </p>
        <p style={{ color: "#9ca3af", marginTop: "0.375rem" }}>
          Be the first to share a delicious recipe
        </p>
      </div>
    );
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: "1.5rem",
      marginTop: "2rem",
    }}>
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
}