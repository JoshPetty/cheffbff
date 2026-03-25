'use client';

import Link from "next/link";
import { Container } from "./styles";

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
  category?: string | null;
  cook_time?: number | null;
  prep_time?: number | null;
}

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const authorName = recipe.author?.username ?? null;
  const authorInitial = authorName?.charAt(0).toUpperCase();

  return (
    <Container>
      <Link href={`/recipes/${recipe.id}`} className="recipe-link">
        <div className="image-container">
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

        <div className="recipe-content">
          {/* Category + cook time row */}
          {(recipe.category || recipe.cook_time) && (
            <div className="recipe-meta-row">
              {recipe.category && (
                <span className="category-badge">{recipe.category}</span>
              )}
              {recipe.cook_time && (
                <span className="cook-time">🕐 {recipe.cook_time} min</span>
              )}
            </div>
          )}

          <h3 className="recipe-title">{recipe.title}</h3>

          {recipe.description && (
            <p className="recipe-description">{recipe.description}</p>
          )}

          <div className="recipe-stats">
            <span className="stat-item">
              🥄 {recipe.ingredients?.length || 0}
            </span>
            {recipe.likesCount !== undefined && (
              <span className="stat-item">♥ {recipe.likesCount}</span>
            )}
            {recipe.commentsCount !== undefined && (
              <span className="stat-item">💬 {recipe.commentsCount}</span>
            )}
            {recipe.savesCount !== undefined && recipe.savesCount > 0 && (
              <span className="stat-item">🔖 {recipe.savesCount}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Author row — outside main link to avoid nested <a> */}
      {authorName && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.375rem",
          padding: "8px 12px", borderTop: "1px solid #f3f4f6",
        }}>
          {recipe.author?.avatar_url ? (
            <img
              src={recipe.author.avatar_url}
              alt={authorName}
              style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: 18, height: 18, borderRadius: "50%",
              background: "linear-gradient(135deg, #86C540, #5DC2D1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 9, flexShrink: 0,
            }}>
              {authorInitial}
            </div>
          )}
          <Link
            href={`/profile/${authorName}`}
            style={{
              fontSize: "0.75rem", color: "#86C540", fontWeight: 500,
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            {authorName}
          </Link>
        </div>
      )}
    </Container>
  );
}