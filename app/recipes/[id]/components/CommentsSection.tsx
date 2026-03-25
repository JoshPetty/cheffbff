"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author: {
    username: string | null;
    avatar_url: string | null;
  } | null;
}

interface CommentsSectionProps {
  recipeId: string;
  initialComments: Comment[];
}

export function CommentsSection({ recipeId, initialComments }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [text, setText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{
    username: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      setUserProfile(data ?? null);
    });
  }, []);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !text.trim()) return;
    setSubmitting(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("comments")
      .insert({ recipe_id: recipeId, user_id: userId, content: text.trim() })
      .select("id, content, created_at, user_id")
      .single();

    if (!error && data) {
      setComments((prev) => [
        { ...data, author: userProfile ?? null },
        ...prev,
      ]);
      setText("");
    }
    setSubmitting(false);
  }

  return (
    <div
      style={{
        maxWidth: "56rem",
        margin: "2.5rem auto 0",
        padding: "0 1.5rem 3rem",
      }}
    >
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "#111827",
          marginBottom: "1.5rem",
          paddingBottom: "0.75rem",
          borderBottom: "3px solid #86C540",
        }}
      >
        Comments ({comments.length})
      </h2>

      {userId && (
        <form onSubmit={submitComment} style={{ marginBottom: "2rem" }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your thoughts about this recipe…"
            rows={3}
            style={{
              width: "100%",
              border: "1.5px solid #e5e7eb",
              borderRadius: 12,
              padding: "12px 16px",
              fontSize: 14,
              color: "#111827",
              resize: "vertical",
              fontFamily: "inherit",
              boxSizing: "border-box",
              outline: "none",
              background: "#fafafa",
            }}
          />
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            style={{
              marginTop: 10,
              padding: "10px 24px",
              borderRadius: 9999,
              border: "none",
              cursor: submitting || !text.trim() ? "default" : "pointer",
              fontSize: 14,
              fontWeight: 600,
              background: "linear-gradient(135deg, #86C540, #5DC2D1)",
              color: "#fff",
              opacity: submitting || !text.trim() ? 0.55 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {submitting ? "Posting…" : "Post comment"}
          </button>
        </form>
      )}

      {comments.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem 1rem",
            color: "#9ca3af",
            background: "#fafafa",
            borderRadius: 12,
            border: "1.5px dashed #e5e7eb",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
          <p style={{ margin: 0, fontWeight: 500 }}>Be the first to comment</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  const name = comment.author?.username ?? "Anonymous";
  const initial = name.charAt(0).toUpperCase();
  const date = new Date(comment.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      style={{
        display: "flex",
        gap: "0.875rem",
        padding: "1.125rem 0",
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          flexShrink: 0,
          background: "linear-gradient(135deg, #86C540, #5DC2D1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 700,
          fontSize: 14,
          overflow: "hidden",
        }}
      >
        {comment.author?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={comment.author.avatar_url}
            alt={name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          initial
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: 4,
          }}
        >
          {comment.author?.username ? (
            <Link
              href={`/profile/${comment.author.username}`}
              style={{ fontWeight: 600, fontSize: 14, color: "#86C540", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              {name}
            </Link>
          ) : (
            <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{name}</span>
          )}
          <span style={{ fontSize: 12, color: "#9ca3af" }}>{date}</span>
        </div>
        <p
          style={{
            fontSize: 14,
            color: "#374151",
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          {comment.content}
        </p>
      </div>
    </div>
  );
}
