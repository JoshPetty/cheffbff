'use client';

import Link from "next/link";
import { Container } from "./styles";
import { LikeButton } from "./LikeButton";
import { SaveToCollection } from "./SaveToCollection";
import { parseIngredient } from "@/app/recipes/ingredientUtils";

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  ingredients: string[] | null;
  instructions: string[] | null;
}

interface Author {
  username: string | null;
  avatar_url: string | null;
}

interface RecipeDetailProps {
  recipe: Recipe;
  author: Author | null;
  likeCount: number;
}

export function RecipeDetail({ recipe, author, likeCount }: RecipeDetailProps) {
  const authorName = author?.username ?? "Anonymous";
  const authorInitial = authorName.charAt(0).toUpperCase();

  return (
    <Container>
      <div className="recipe-container">
        {/* Image */}
        <div className="image-section">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="recipe-image"
            />
          ) : (
            <div className="placeholder-image">
              <span className="emoji">🍳</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="content-section">
          <h1 className="recipe-title">{recipe.title}</h1>

          {/* Author row */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
            {author?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={author.avatar_url}
                alt={authorName}
                style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "linear-gradient(135deg, #86C540, #5DC2D1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: 12, flexShrink: 0,
              }}>
                {authorInitial}
              </div>
            )}
            <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
              by{" "}
              {author?.username ? (
                <Link
                  href={`/profile/${author.username}`}
                  style={{ fontWeight: 600, color: "#86C540", textDecoration: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                >
                  {authorName}
                </Link>
              ) : (
                <span style={{ fontWeight: 600, color: "#374151" }}>{authorName}</span>
              )}
            </span>
          </div>

          {/* Like + Save row */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <LikeButton recipeId={recipe.id} initialCount={likeCount} />
            <SaveToCollection recipeId={recipe.id} />
          </div>

          {recipe.description && (
            <p className="recipe-description">{recipe.description}</p>
          )}

          {/* Ingredients */}
          <div className="section">
            <h2 className="section-title">Ingredients</h2>
            <ul className="ingredients-list">
              {recipe.ingredients?.map((ingredient, index) => {
                const { amount, unit, name } = parseIngredient(ingredient);
                const measure = [amount, unit].filter(Boolean).join(" ");
                return (
                  <li key={index} className="ingredient-item">
                    <span className="bullet">•</span>
                    <span>
                      {measure && (
                        <strong style={{ fontWeight: 700, marginRight: "0.35rem" }}>
                          {measure}
                        </strong>
                      )}
                      {name || ingredient}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Instructions */}
          <div className="section">
            <h2 className="section-title">Instructions</h2>
            <ol className="instructions-list">
              {recipe.instructions?.map((instruction, index) => (
                <li key={index} className="instruction-item">
                  <span className="step-number">{index + 1}</span>
                  <p>{instruction}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </Container>
  );
}
