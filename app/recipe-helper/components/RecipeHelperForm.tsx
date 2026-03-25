"use client";

import { useState } from "react";
import { Container } from "./styles";

interface Recipe {
  title: string;
  match_score: number;
  has_ingredients: string[];
  needs_ingredients: string[];
  total_ingredients: number;
  directions: string;
  link: string | null;
  source: string;
}

interface IngredientItem {
  name: string;
  required: boolean;
}

export function RecipeHelperForm() {
  const [ingredients, setIngredients] = useState<IngredientItem[]>([{ name: "", required: false }]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [results, setResults] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const allergyOptions = [
    "dairy", "eggs", "peanuts", "tree nuts", 
    "shellfish", "fish", "gluten", "soy"
  ];

  function addIngredient() {
    setIngredients([...ingredients, { name: "", required: false }]);
  }

  function updateIngredientName(index: number, name: string) {
    const newIngredients = [...ingredients];
    newIngredients[index].name = name;
    setIngredients(newIngredients);
  }

  function toggleRequired(index: number) {
    const newIngredients = [...ingredients];
    newIngredients[index].required = !newIngredients[index].required;
    setIngredients(newIngredients);
  }

  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function toggleAllergy(allergy: string) {
    if (allergies.includes(allergy)) {
      setAllergies(allergies.filter(a => a !== allergy));
    } else {
      setAllergies([...allergies, allergy]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResults([]);

    const cleanIngredients = ingredients
      .map(i => i.name.trim())
      .filter(i => i !== "");

    const requiredIngredients = ingredients
      .filter(i => i.required && i.name.trim() !== "")
      .map(i => i.name.trim());

    if (cleanIngredients.length === 0) {
      setError("Please add at least one ingredient");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ingredients: cleanIngredients,
          allergies: allergies.length > 0 ? allergies : null,
          required_ingredients: requiredIngredients.length > 0 ? requiredIngredients : null,
          top_n: 10,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch recipes");
      }

      const data = await response.json();
      
      if (data.recipes.length === 0) {
        setError("No recipes found matching your criteria. Try removing required ingredients or adding more ingredients.");
      } else {
        setResults(data.recipes);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container>
      <form onSubmit={handleSubmit} className="helper-form">
        {/* Ingredients Input */}
        <div className="form-section">
          <h3 className="section-title">Your Ingredients</h3>
          <p className="section-description">
            Tell us what you have in your kitchen. Mark ingredients as "required" to only show recipes that include them.
          </p>
          
          <div className="ingredients-list">
            {ingredients.map((ingredient, index) => (
              <div key={index} className="ingredient-input-row">
                <input
                  type="text"
                  value={ingredient.name}
                  onChange={(e) => updateIngredientName(index, e.target.value)}
                  placeholder="e.g., chicken"
                  className="ingredient-input"
                />
                <button
                  type="button"
                  onClick={() => toggleRequired(index)}
                  className={`required-btn ${ingredient.required ? 'active' : ''}`}
                  title={ingredient.required ? "Required ingredient" : "Optional ingredient"}
                >
                  {ingredient.required ? "★" : "☆"}
                </button>
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="remove-btn"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <button
            type="button"
            onClick={addIngredient}
            className="add-ingredient-btn"
          >
            + Add Another Ingredient
          </button>

          {ingredients.some(i => i.required) && (
            <div className="required-info">
              <strong>★ = Required:</strong> Recipes MUST include this ingredient
            </div>
          )}
        </div>

        {/* Allergies */}
        <div className="form-section">
          <h3 className="section-title">Dietary Restrictions</h3>
          <p className="section-description">We'll filter out recipes with these ingredients</p>
          
          <div className="allergy-grid">
            {allergyOptions.map((allergy) => (
              <label key={allergy} className="allergy-checkbox">
                <input
                  type="checkbox"
                  checked={allergies.includes(allergy)}
                  onChange={() => toggleAllergy(allergy)}
                />
                <span>{allergy}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="error-message">{error}</div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="submit-btn"
        >
          {loading ? "Finding Recipes..." : "Find Recipes "}
        </button>
      </form>

      {/* Results */}
      {results.length > 0 && (
        <div className="results-section">
          <h2 className="results-title">
            Found {results.length} Matching Recipes! 
          </h2>
          
          <div className="results-grid">
            {results.map((recipe, index) => (
              <div key={index} className="recipe-card">
                <div className="recipe-header">
                  <h3 className="recipe-title">{recipe.title}</h3>
                  <div className="match-score">
                    {recipe.match_score}% Match
                  </div>
                </div>

                <div className="match-bar">
                  <div 
                    className="match-fill"
                    style={{ width: `${recipe.match_score}%` }}
                  />
                </div>

                <div className="ingredients-section">
                  {recipe.has_ingredients.length > 0 && (
                    <div className="has-ingredients">
                      <strong> You have:</strong>
                      <p>{recipe.has_ingredients.join(", ")}</p>
                    </div>
                  )}
                  
                  {recipe.needs_ingredients.length > 0 && (
                    <div className="needs-ingredients">
                      <strong>➕ You need:</strong>
                      <p>{recipe.needs_ingredients.slice(0, 5).join(", ")}</p>
                      {recipe.needs_ingredients.length > 5 && (
                        <span className="more-ingredients">
                          +{recipe.needs_ingredients.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="recipe-footer">
                  <span className="total-ingredients">
                    {recipe.total_ingredients} total ingredients
                  </span>
                  {recipe.link && (
                    <a 
                      href={recipe.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="view-link"
                    >
                      View Recipe 
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}