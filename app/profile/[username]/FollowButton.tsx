"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface FollowButtonProps {
  profileUserId: string;
  initialFollowerCount: number;
  initialFollowing: boolean;
}

export function FollowButton({
  profileUserId,
  initialFollowerCount,
  initialFollowing,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setViewerId(user.id);
    });
  }, []);

  async function toggle() {
    if (!viewerId) {
      router.push("/auth/login");
      return;
    }
    if (loading) return;
    setLoading(true);

    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setFollowerCount((c) => (wasFollowing ? c - 1 : c + 1));

    const supabase = createClient();
    if (wasFollowing) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", viewerId)
        .eq("following_id", profileUserId);
    } else {
      await supabase.from("follows").insert({
        follower_id: viewerId,
        following_id: profileUserId,
      });
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <button
        onClick={toggle}
        style={{
          padding: "8px 20px",
          borderRadius: 9999,
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          border: following ? "1.5px solid #e5e7eb" : "none",
          background: following
            ? "#fff"
            : "linear-gradient(135deg, #86C540, #5DC2D1)",
          color: following ? "#374151" : "#fff",
          transition: "all 0.2s",
          boxShadow: following ? "none" : "0 2px 8px rgba(134,197,64,0.25)",
        }}
      >
        {following ? "Following" : "Follow"}
      </button>
      <span style={{ fontSize: 13, color: "#9ca3af" }}>
        {followerCount} {followerCount === 1 ? "follower" : "followers"}
      </span>
    </div>
  );
}
