"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface ForkButtonProps {
  recipe: {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    ingredients: string[] | null;
    instructions: string[] | null;
    category: string | null;
    cook_time: number | null;
    prep_time: number | null;
    servings: number | null;
  };
  originalAuthor: string | null;
}

export function ForkButton({ recipe, originalAuthor }: ForkButtonProps) {
  const [show, setShow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && user.id !== recipe.user_id) setShow(true);
    });
  }, [recipe.user_id]);

  if (!show) return null;

  function handleFork() {
    const forkData = {
      originalId: recipe.id,
      originalTitle: recipe.title,
      originalAuthor,
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients ?? [],
      instructions: recipe.instructions ?? [],
      category: recipe.category,
      cook_time: recipe.cook_time,
      prep_time: recipe.prep_time,
      servings: recipe.servings,
    };
    sessionStorage.setItem("chefbff_fork", JSON.stringify(forkData));
    router.push("/recipes/new");
  }

  return (
    <button
      onClick={handleFork}
      style={{
        display: "inline-flex", alignItems: "center", gap: "0.375rem",
        padding: "0.4rem 0.875rem",
        border: "1.5px solid #e5e7eb",
        borderRadius: 20, background: "#fff",
        color: "#6b7280",
        fontWeight: 600, fontSize: 14, cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "#86C540";
        e.currentTarget.style.color = "#4a8f15";
        e.currentTarget.style.background = "rgba(134,197,64,0.07)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "#e5e7eb";
        e.currentTarget.style.color = "#6b7280";
        e.currentTarget.style.background = "#fff";
      }}
    >
      🍴 Fork Recipe
    </button>
  );
}
