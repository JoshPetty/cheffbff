# ChefBFF

A full-stack recipe sharing and social platform built with Next.js and Supabase. Users can create, discover, and save recipes, follow other cooks, and get AI-powered recipe suggestions from pantry ingredients.

---

## Features

**Recipe Management**
- Create recipes with structured ingredients (amount, unit, name), step-by-step instructions, images, category, and cook/prep times
- Edit, make private, or delete your recipes
- Import recipes from any URL using Claude AI extraction

**Discovery and Browse**
- Browse all public recipes with full-text search, category filters, cook time filters, and sort options
- Recipe cards show category, cook time, like count, comment count, and library saves

**Social**
- Follow other cooks and see their latest recipes in a dedicated feed
- Like and comment on recipes
- Public profile pages showing a cook's bio, stats, and recipe grid

**Library and Collections**
- Save recipes to a personal library with a bookmark toggle
- Organise saved recipes into named collections (public or private)

**Dashboard**
- Persistent sidebar layout for Feed, Library, Cookbooks, Profile, and Discover
- Mobile-responsive with a bottom tab bar

**AI Features**
- Pantry to Plate: enter available ingredients, get recipe matches ranked by score with allergen filtering
- Import from URL: paste any recipe page URL and Claude extracts and pre-fills the create form

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

## Project Structure

```
chefbff/
├── app/
│   ├── api/
│   │   └── import-recipe/       # Claude-powered URL import endpoint
│   ├── auth/                    # Login and signup pages
│   ├── collections/             # Collections list and detail pages
│   ├── components/
│   │   ├── Navigation/          # Top navigation bar
│   │   ├── RecipeCard/          # Shared recipe card component
│   │   ├── Hero/
│   │   ├── FeaturedRecipes/
│   │   └── Footer/
│   ├── dashboard/               # Sidebar layout and dashboard pages
│   │   ├── layout.tsx           # Persistent sidebar layout
│   │   ├── DashboardSidebar.tsx
│   │   ├── feed/                # Social feed from followed users
│   │   ├── library/             # Saved recipes
│   │   ├── collections/         # Cookbooks view
│   │   └── profile/             # Profile summary and recipe grid
│   ├── profile/                 # Profile edit page
│   │   └── [username]/          # Public profile pages
│   ├── recipe-helper/           # Pantry to Plate AI matcher
│   ├── recipes/
│   │   ├── page.tsx             # Browse with search and filters
│   │   ├── new/                 # Create recipe form
│   │   ├── [id]/                # Recipe detail, comments, like, save
│   │   │   └── edit/            # Edit recipe form
│   │   ├── IngredientRow.tsx    # Structured ingredient input component
│   │   └── ingredientUtils.ts   # Parse and format ingredient strings
│   └── page.tsx                 # Homepage
├── lib/
│   ├── supabase.ts              # Browser Supabase client
│   └── supabase-server.ts       # Server Supabase client (cookie-aware)
├── python/
│   ├── main.py                  # FastAPI service
│   ├── matcher.py               # Recipe matching engine
│   └── requirements.txt
└── public/
```

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

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.8+ (for the recipe matching service)
- A Supabase project

### Installation

**1. Clone and install dependencies**

```bash
git clone <repository-url>
cd chefbff
npm install
```

**2. Set up environment variables**

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
FASTAPI_URL=http://localhost:8000
```

**3. Set up the Python matching service (optional)**

```bash
cd python
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

Place your `recipes.csv` dataset in the `data/` directory.

### Running

**Next.js (required)**

```bash
npm run dev
```

**FastAPI matching service (optional)**

```bash
cd python
source venv/bin/activate
uvicorn main:app --reload
```

- Frontend: http://localhost:3000
- FastAPI docs: http://localhost:8000/docs

---

## API

### Import Recipe — `POST /api/import-recipe`

Fetches a webpage, strips HTML, and uses Claude to extract structured recipe data.

```json
Request:  { "url": "https://example.com/recipe" }

Response: {
  "title": "...",
  "description": "...",
  "ingredients": ["2 cups flour", "..."],
  "instructions": ["Step 1...", "..."],
  "prep_time": 15,
  "cook_time": 30,
  "category": "Dinner"
}
```

### FastAPI Matching — `POST /match`

```json
Request: {
  "ingredients": ["chicken", "garlic"],
  "allergies": ["nuts"],
  "required_ingredients": ["chicken"],
  "top_n": 10
}

Response: [{ "title": "...", "score": 0.87, "missing": ["..."] }]
```

---

## Deployment

**Frontend**

```bash
npm run build
npm start
```

Deployable to Vercel or any Node.js host. Set all environment variables in the hosting dashboard.

**FastAPI service**

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

Deployable to Railway, Render, or any container host. Update `FASTAPI_URL` in your frontend environment to point to the deployed service.

---

## License

MIT
