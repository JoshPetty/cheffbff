"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

// ── SVG icons (18×18, stroke-based) ──────────────────────────────────────
const Icons = {
  Feed: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  ),
  Library: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Cookbooks: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  Profile: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Discover: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  SignOut: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

// ── Nav items ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: "Feed",      href: "/dashboard/feed",        Icon: Icons.Feed },
  { label: "Library",   href: "/dashboard/library",     Icon: Icons.Library },
  { label: "Cookbooks", href: "/dashboard/collections", Icon: Icons.Cookbooks },
  { label: "Profile",   href: "/dashboard/profile",     Icon: Icons.Profile },
  { label: "Discover",  href: "/recipes",               Icon: Icons.Discover },
];

interface Profile {
  username: string | null;
  avatar_url: string | null;
}

// ── Component ─────────────────────────────────────────────────────────────
export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [initial, setInitial] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setInitial((user.email ?? "?").charAt(0).toUpperCase());
      const { data } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("user_id", user.id)
        .single();
      if (data) setProfile(data);
    });
  }, []);

  function isActive(href: string) {
    if (href === "/dashboard/feed") {
      return pathname === "/dashboard/feed" || pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  const displayName = profile?.username ?? initial ?? "…";

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="dash-sidebar">
        {/* Logo */}
        <Link href="/" className="dash-logo">
          <Image src="/logo.jpg" alt="ChefBFF" width={32} height={32} className="rounded-lg" />
          <span className="dash-logo-text">ChefBFF</span>
        </Link>

        {/* Nav */}
        <nav className="dash-nav">
          {NAV_ITEMS.map(({ label, href, Icon }) => (
            <Link
              key={href}
              href={href}
              className={`dash-link${isActive(href) ? " active" : ""}`}
            >
              <span className="dash-link-icon"><Icon /></span>
              <span className="dash-link-label">{label}</span>
            </Link>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        {/* User */}
        <div className="dash-user">
          <Link href="/dashboard/profile" className="dash-user-info">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="dash-avatar-img"
              />
            ) : (
              <div className="dash-avatar-placeholder">{initial}</div>
            )}
            <span className="dash-user-name">{displayName}</span>
          </Link>

          <button onClick={handleSignOut} className="dash-signout" title="Sign out">
            <Icons.SignOut />
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ───────────────────────────────────────── */}
      <nav className="dash-bottom-bar" aria-label="Main navigation">
        {NAV_ITEMS.map(({ label, href, Icon }) => (
          <Link
            key={href}
            href={href}
            className={`dash-tab${isActive(href) ? " active" : ""}`}
          >
            <Icon />
            <span className="dash-tab-label">{label}</span>
          </Link>
        ))}
      </nav>

      {/* ── Global styles ───────────────────────────────────────────────── */}
      <style>{`
        /* ── Sidebar ─────────────────────────────────────────── */
        .dash-sidebar {
          position: fixed;
          top: 0; left: 0;
          width: 220px;
          height: 100vh;
          background: #fff;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          padding: 1.25rem 0 1rem;
          z-index: 50;
          overflow-y: auto;
        }

        /* Logo */
        .dash-logo {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0 1rem 0 1.125rem;
          margin-bottom: 1.75rem;
          text-decoration: none;
        }
        .dash-logo-text {
          font-size: 1rem;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.025em;
        }

        /* Nav list */
        .dash-nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 0 0.625rem;
        }

        /* Nav link */
        .dash-link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5625rem 0.75rem 0.5625rem 0.875rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          color: #6b7280;
          text-decoration: none;
          transition: color 0.15s, background 0.15s;
        }
        .dash-link::before {
          content: '';
          position: absolute;
          left: 0; top: 6px; bottom: 6px;
          width: 3px;
          border-radius: 0 2px 2px 0;
          background: transparent;
          transition: background 0.15s;
        }
        .dash-link:hover {
          color: #111827;
          background: #f9fafb;
        }
        .dash-link.active {
          color: #111827;
          font-weight: 700;
          background: transparent;
        }
        .dash-link.active::before {
          background: #86C540;
        }
        .dash-link-icon {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          opacity: 0.8;
        }
        .dash-link.active .dash-link-icon {
          opacity: 1;
          color: #86C540;
        }
        .dash-link-label {
          line-height: 1;
        }

        /* User section */
        .dash-user {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 0.875rem 0.5rem;
          border-top: 1px solid #e5e7eb;
          margin: 0 0 0;
        }
        .dash-user-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          flex: 1;
          min-width: 0;
        }
        .dash-avatar-img {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }
        .dash-avatar-placeholder {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: linear-gradient(135deg, #86C540, #5DC2D1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 700;
          font-size: 12px;
          flex-shrink: 0;
        }
        .dash-user-name {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #111827;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .dash-signout {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 5px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s, background 0.15s;
          flex-shrink: 0;
        }
        .dash-signout:hover {
          color: #dc2626;
          background: #fef2f2;
        }

        /* ── Mobile bottom bar (hidden on desktop) ───────────── */
        .dash-bottom-bar { display: none; }

        @media (max-width: 768px) {
          .dash-sidebar { display: none; }

          .dash-bottom-bar {
            display: flex;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            height: 58px;
            background: #fff;
            border-top: 1px solid #e5e7eb;
            z-index: 50;
          }
          .dash-tab {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            text-decoration: none;
            color: #9ca3af;
            transition: color 0.15s;
          }
          .dash-tab.active { color: #86C540; }
          .dash-tab-label {
            font-size: 9px;
            font-weight: 500;
            line-height: 1;
          }
        }
      `}</style>
    </>
  );
}
