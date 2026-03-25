"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export function EditButton({ recipeId, recipeUserId }: { recipeId: string; recipeUserId: string }) {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsOwner(!!user && user.id === recipeUserId);
    });
  }, [recipeUserId]);

  if (!isOwner) return null;

  return (
    <Link
      href={`/recipes/${recipeId}/edit`}
      style={{
        display: "inline-flex", alignItems: "center", gap: "0.4rem",
        padding: "0.5rem 1.25rem",
        background: "linear-gradient(135deg, #86C540, #5DC2D1)",
        color: "#fff", fontWeight: 600, fontSize: "0.875rem",
        borderRadius: "0.5rem", textDecoration: "none",
        boxShadow: "0 2px 8px rgba(134,197,64,0.25)",
        transition: "opacity 0.2s",
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
      onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
    >
      ✏️ Edit Recipe
    </Link>
  );
}
