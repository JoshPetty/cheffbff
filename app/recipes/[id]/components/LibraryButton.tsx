"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface LibraryButtonProps {
  recipeId: string;
}

export function LibraryButton({ recipeId }: LibraryButtonProps) {
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setReady(true);
        return;
      }
      const { data } = await supabase
        .from("library")
        .select("id")
        .eq("user_id", user.id)
        .eq("recipe_id", recipeId)
        .maybeSingle();
      setSaved(!!data);
      setReady(true);
    });
  }, [recipeId]);

  async function toggle() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const wasSaved = saved;
    setSaved(!wasSaved); // optimistic

    if (wasSaved) {
      await supabase
        .from("library")
        .delete()
        .eq("user_id", user.id)
        .eq("recipe_id", recipeId);
    } else {
      await supabase
        .from("library")
        .insert({ user_id: user.id, recipe_id: recipeId });
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={!ready}
      title={saved ? "Remove from Library" : "Save to Library"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.375rem",
        padding: "0.4rem 0.875rem",
        border: saved ? "1.5px solid #5DC2D1" : "1.5px solid #e5e7eb",
        borderRadius: 20,
        background: saved ? "rgba(93,194,209,0.1)" : "#fff",
        color: saved ? "#0e7490" : "#6b7280",
        fontWeight: 600,
        fontSize: 14,
        cursor: ready ? "pointer" : "default",
        transition: "all 0.2s",
        opacity: ready ? 1 : 0.6,
      }}
      onMouseEnter={(e) => {
        if (!saved && ready) {
          e.currentTarget.style.borderColor = "#5DC2D1";
          e.currentTarget.style.color = "#0e7490";
        }
      }}
      onMouseLeave={(e) => {
        if (!saved) {
          e.currentTarget.style.borderColor = "#e5e7eb";
          e.currentTarget.style.color = "#6b7280";
        }
      }}
    >
      {/* Bookmark icon — filled when saved */}
      <svg
        width="14"
        height="16"
        viewBox="0 0 14 18"
        fill={saved ? "#5DC2D1" : "none"}
        stroke={saved ? "#5DC2D1" : "currentColor"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 1h12v16l-6-4-6 4V1z" />
      </svg>
      <span>{saved ? "Saved" : "Save"}</span>
    </button>
  );
}
