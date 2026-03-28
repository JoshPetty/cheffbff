'use client';

import Link from "next/link";
import { Container } from "./styles";
import { LikeButton } from "./LikeButton";
import { LibraryButton } from "./LibraryButton";
import { SaveToCollection } from "./SaveToCollection";
import { ServingsScaler } from "./ServingsScaler";
import { ForkButton } from "./ForkButton";

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  ingredients: string[] | null;
  instructions: string[] | null;
  servings: number | null;
  user_id: string;
  forked_from: string | null;
  fork_count: number;
  category: string | null;
  cook_time: number | null;
  prep_time: number | null;
}

interface Author {
  username: string | null;
  avatar_url: string | null;
}

interface ForkedFromInfo {
  id: string;
  title: string;
  authorUsername: string | null;
}

interface RecipeDetailProps {
  recipe: Recipe;
  author: Author | null;
  likeCount: number;
  forkedFromInfo?: ForkedFromInfo | null;
}

export function RecipeDetail({ recipe, author, likeCount, forkedFromInfo }: RecipeDetailProps) {
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

          {/* Forked-from attribution */}
          {forkedFromInfo && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "0.35rem",
              fontSize: "0.8125rem", color: "#6b7280",
              marginBottom: "0.875rem",
            }}>
              <span>🍴</span>
              <span>Forked from</span>
              <Link
                href={`/recipes/${forkedFromInfo.id}`}
                style={{ color: "#86C540", fontWeight: 600, textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
              >
                {forkedFromInfo.title}
              </Link>
              {forkedFromInfo.authorUsername && (
                <>
                  <span>by</span>
                  <Link
                    href={`/profile/${forkedFromInfo.authorUsername}`}
                    style={{ color: "#86C540", fontWeight: 600, textDecoration: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                    onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
                  >
                    {forkedFromInfo.authorUsername}
                  </Link>
                </>
              )}
            </div>
          )}

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
                  onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
                >
                  {authorName}
                </Link>
              ) : (
                <span style={{ fontWeight: 600, color: "#374151" }}>{authorName}</span>
              )}
            </span>
          </div>

          {/* Actions row: Like · Library · Save · Fork · Fork count */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <LikeButton recipeId={recipe.id} initialCount={likeCount} />
            <LibraryButton recipeId={recipe.id} />
            <SaveToCollection recipeId={recipe.id} />
            <ForkButton
              recipe={{
                id: recipe.id,
                user_id: recipe.user_id,
                title: recipe.title,
                description: recipe.description,
                ingredients: recipe.ingredients,
                instructions: recipe.instructions,
                category: recipe.category,
                cook_time: recipe.cook_time,
                prep_time: recipe.prep_time,
                servings: recipe.servings,
              }}
              originalAuthor={author?.username ?? null}
            />
            {recipe.fork_count > 0 && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "0.25rem",
                fontSize: 14, color: "#6b7280",
              }}>
                🍴 {recipe.fork_count} {recipe.fork_count === 1 ? "fork" : "forks"}
              </span>
            )}
          </div>

          {recipe.description && (
            <p className="recipe-description">{recipe.description}</p>
          )}

          {/* Ingredients + Servings Scaler */}
          <div className="section">
            <h2 className="section-title">Ingredients</h2>
            {recipe.ingredients && recipe.ingredients.length > 0 && (
              <ServingsScaler
                originalServings={recipe.servings ?? 4}
                ingredients={recipe.ingredients}
              />
            )}
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
