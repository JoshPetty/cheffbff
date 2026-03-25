"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface LikeButtonProps {
  recipeId: string;
  initialCount: number;
}

export function LikeButton({ recipeId, initialCount }: LikeButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("likes")
        .select("id")
        .eq("recipe_id", recipeId)
        .eq("user_id", user.id)
        .maybeSingle();
      setLiked(!!data);
    });
  }, [recipeId]);

  async function toggle() {
    if (!userId) {
      router.push("/auth/login");
      return;
    }
    if (loading) return;
    setLoading(true);

    const wasLiked = liked;
    setLiked(!wasLiked);
    setCount((c) => (wasLiked ? c - 1 : c + 1));

    const supabase = createClient();
    if (wasLiked) {
      await supabase
        .from("likes")
        .delete()
        .eq("recipe_id", recipeId)
        .eq("user_id", userId);
    } else {
      await supabase.from("likes").insert({ recipe_id: recipeId, user_id: userId });
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      aria-label={liked ? "Unlike recipe" : "Like recipe"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "9px 20px",
        borderRadius: 9999,
        cursor: "pointer",
        border: liked ? "none" : "1.5px solid #e5e7eb",
        background: liked
          ? "linear-gradient(135deg, #86C540, #5DC2D1)"
          : "#fff",
        color: liked ? "#fff" : "#6b7280",
        fontSize: 14,
        fontWeight: 600,
        transition: "all 0.2s",
        boxShadow: liked ? "0 2px 8px rgba(134,197,64,0.3)" : "none",
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1 }}>{liked ? "♥" : "♡"}</span>
      {count}
    </button>
  );
}
