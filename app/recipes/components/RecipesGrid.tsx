import { RecipeCard } from "@/app/components/RecipeCard/RecipeCard";
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
  author: Author | null;
  likesCount?: number;
  commentsCount?: number;
  savesCount?: number;
  category?: string | null;
  cook_time?: number | null;
  prep_time?: number | null;
}

interface RecipesGridProps {
  recipes: Recipe[];
}

export function RecipesGrid({ recipes }: RecipesGridProps) {
  if (!recipes || recipes.length === 0) {
    return (
      <Container>
        <div className="empty-state">
          <span className="emoji">🍳</span>
          <h2>No recipes yet!</h2>
          <p>Be the first to share a delicious recipe</p>
          <Link href="/recipes/new" className="cta-button">
            Add the First Recipe
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="recipes-grid">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </Container>
  );
}
