# ChefBFF

A full-stack recipe sharing and social platform built with Next.js and Supabase. Users can create, discover, and save recipes, follow other cooks, and get AI-powered recipe suggestions from pantry ingredients.
---
Vercel Deployment: [ChefBFF](https://chefbff.vercel.app/)


## Current Features (As of March 2026)

**Recipe Management**
- Create recipes with structured ingredients (amount, unit, name), step-by-step instructions, images, category, and cook/prep times
- Edit, make private, or delete your recipes
- Import recipes from any URL using Claude API

**Discovery and Browse**
- Browse all public recipes with text-search, category filters, cook time filters, and sort options
- Recipe cards show category, cook time, like count, comment count, and library saves

**Social**
- Follow other cooks and see their latest recipes in the feed section
- Like and comment on recipes
- Public profile pages showing a cook's bio, stats, and recipe grid

**Library and Collections**
- Save recipes to a personal library with a bookmark button
- Saved recipes into named either public or private collections (


**AI/ML Features In Progress**
- Pantry to Plate: enter available ingredients you have in your house, get recipe matches ranked by score with allergen filtering
- Import from URL: paste any recipe page URL and Claude extracts and pre-fills the create form - Finished

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript / React 19 |
| Styling | Tailwind CSS 4, Styled Components 6 |
| Database | Supabase (PostgreSQL + Storage) |
| Auth | Supabase Auth |
| AI (import) | Anthropic Claude API |
| AI (matching) | FastAPI + Python (TF-IDF / cosine similarity) |

---


## Database Schema

```sql
-- Core
recipes        (id, user_id, title, description, ingredients[], instructions[],
                image_url, category, cook_time, prep_time, is_public, created_at)
profiles       (id, user_id, username, full_name, bio, avatar_url)

-- Social
likes          (id, user_id, recipe_id)
comments       (id, user_id, recipe_id, content, created_at)
follows        (follower_id, following_id)

-- Saving
library        (id, user_id, recipe_id, saved_at)
collections    (id, user_id, name, description, is_public, cover_image_url)
collection_recipes (id, collection_id, recipe_id, added_at)
```

---


