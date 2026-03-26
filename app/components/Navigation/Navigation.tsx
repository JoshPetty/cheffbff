"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import { Container } from "./styles";

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const closeMenu = () => setIsMenuOpen(false);
  const isActive = (path: string) => pathname === path;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const displayName = user?.email?.split('@')[0];

  return (
    <Container className={isScrolled ? 'scrolled' : ''}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link
            href="/"
            className="logo"
            onClick={closeMenu}
          >
            <Image
              src="/logo.jpg"
              alt="ChefBFF"
              width={45}
              height={45}
              className="rounded-lg"
            />
            <span>ChefBFF</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className={`desktop-nav ${isMenuOpen ? 'active' : ''}`}>
            <Link
              href="/"
              onClick={closeMenu}
              className={isActive('/') ? 'active' : ''}
            >
              Home
            </Link>
            <Link
              href="/recipes"
              onClick={closeMenu}
              className={isActive('/recipes') ? 'active' : ''}
            >
              Recipes
            </Link>
            <Link
              href="/recipe-helper"
              onClick={closeMenu}
              className={isActive('/recipe-helper') ? 'active' : ''}
            >
              Pantry to Plate
            </Link>
            {user && (
              <Link
                href="/dashboard/library"
                onClick={closeMenu}
                className={isActive('/dashboard/library') ? 'active' : ''}
              >
                Library
              </Link>
            )}
            {user && (
              <Link
                href="/collections"
                onClick={closeMenu}
                className={isActive('/collections') ? 'active' : ''}
              >
                Menus
              </Link>
            )}
            <Link
              href="/recipes/new"
              onClick={closeMenu}
              className="button"
            >
              Add Recipe
            </Link>
          </nav>

          {/* Auth Section (desktop) */}
          <div className="auth-section">
            {user ? (
              <Link
                href="/profile"
                title={displayName}
                style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: "linear-gradient(135deg, #86C540, #5DC2D1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: 16,
                  textDecoration: "none", flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(134,197,64,0.35)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = "scale(1.08)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(134,197,64,0.45)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(134,197,64,0.35)";
                }}
              >
                {displayName?.charAt(0).toUpperCase()}
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  style={{ fontSize: 14, fontWeight: 500, color: "#4b5563", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#86C540")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#4b5563")}
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  style={{
                    fontSize: 14, fontWeight: 600, color: "#fff",
                    padding: "8px 18px", borderRadius: 8, textDecoration: "none",
                    background: "linear-gradient(135deg, #86C540, #5DC2D1)",
                  }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div
            className={`menu ${isMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          />
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="mobile-overlay" onClick={closeMenu}>
          <div className="mobile-menu">
            <Link href="/" onClick={closeMenu}>Home</Link>
            <Link href="/recipes" onClick={closeMenu}>Recipes</Link>
            <Link href="/recipe-helper" onClick={closeMenu}>Recipe Helper</Link>
            {user && <Link href="/dashboard/library" onClick={closeMenu}>Library</Link>}
            {user && <Link href="/collections" onClick={closeMenu}>My Collections</Link>}
            <Link href="/recipes/new" onClick={closeMenu} className="button">Add Recipe</Link>
            {user ? (
              <>
                <Link
                  href="/profile"
                  onClick={closeMenu}
                  style={{
                    width: 56, height: 56, borderRadius: "50%",
                    background: "linear-gradient(135deg, #86C540, #5DC2D1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 700, fontSize: 22,
                    textDecoration: "none",
                  }}
                >
                  {displayName?.charAt(0).toUpperCase()}
                </Link>
                <span style={{ fontSize: 14, color: "#6b7280" }}>{displayName}</span>
                <button
                  onClick={() => { closeMenu(); handleSignOut(); }}
                  style={{
                    padding: "10px 28px", border: "1.5px solid #fecaca",
                    borderRadius: 10, background: "#fff",
                    color: "#dc2626", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={closeMenu}>Login</Link>
                <Link href="/auth/signup" onClick={closeMenu} className="button">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </Container>
  );
}
