from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from matcher import get_matcher
import os

app = FastAPI()

origins = [
    "http://localhost:3000",
    os.getenv("FRONTEND_URL", ""),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in origins if o],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MatchRequest(BaseModel):
    ingredients: List[str]
    allergies: Optional[List[str]] = None
    required_ingredients: Optional[List[str]] = None
    top_n: Optional[int] = 10

@app.on_event("startup")
async def startup_event():
    """Load dataset on startup"""
    print("Starting up...")
    get_matcher()
    print("Ready!")

@app.get("/")
async def root():
    return {"message": "Recipe Matcher API is running!"}

@app.post("/match")
async def match_recipes(request: MatchRequest):
    """Find recipes matching user ingredients"""
    try:
        matcher = get_matcher()
        results = matcher.find_matches(
            user_ingredients=request.ingredients,
            allergies=request.allergies,
            required_ingredients=request.required_ingredients,  # NEW!
            top_n=request.top_n
        )
        return {
            "success": True,
            "count": len(results),
            "recipes": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.get("/health")
async def health_check():
    return {"status": "healthy", "recipes_loaded": len(get_matcher().df)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)