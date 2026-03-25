"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const CATEGORIES = [
  "Breakfast", "Lunch", "Dinner", "Dessert",
  "Snack", "Soup", "Salad", "Baking", "Vegetarian", "Vegan",
];

const COOK_TIME_OPTIONS = [
  { label: "Any time", value: "" },
  { label: "Under 15 min", value: "15" },
  { label: "Under 30 min", value: "30" },
  { label: "Under 60 min", value: "60" },
  { label: "60+ min", value: "60+" },
];

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Most Liked", value: "liked" },
  { label: "Most Commented", value: "commented" },
];

interface RecipeFiltersProps {
  initialQ: string;
  initialCategory: string;
  initialCookTime: string;
  initialSort: string;
  totalCount: number;
  hasActiveFilters: boolean;
}

export function RecipeFilters({
  initialQ,
  initialCategory,
  initialCookTime,
  initialSort,
  totalCount,
  hasActiveFilters,
}: RecipeFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(initialQ);

  // Sync local search input when URL changes (e.g. reset or browser back)
  useEffect(() => {
    setQ(initialQ);
  }, [initialQ]);

  function buildUrl(overrides: Record<string, string>) {
    const merged = {
      q,
      category: initialCategory,
      cookTime: initialCookTime,
      sort: initialSort,
      ...overrides,
    };
    const params = new URLSearchParams();
    if (merged.q.trim()) params.set("q", merged.q.trim());
    if (merged.category) params.set("category", merged.category);
    if (merged.cookTime) params.set("cookTime", merged.cookTime);
    if (merged.sort && merged.sort !== "newest") params.set("sort", merged.sort);
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  // Debounced search — only re-runs when q changes
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(buildUrl({ q }), { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  function clearSearch() {
    setQ("");
    router.push(buildUrl({ q: "" }), { scroll: false });
  }

  function handleSelect(key: string, val: string) {
    router.push(buildUrl({ [key]: val }), { scroll: false });
  }

  function clearAll() {
    setQ("");
    router.push(pathname, { scroll: false });
  }

  const selectStyle: React.CSSProperties = {
    padding: "0.5rem 0.875rem",
    border: "1.5px solid #e5e7eb", borderRadius: 8,
    fontSize: 13, fontWeight: 500, color: "#374151",
    background: "#fff", cursor: "pointer", outline: "none",
    appearance: "auto",
  };

  return (
    <div style={{ marginBottom: "2rem" }}>
      {/* Search bar */}
      <div style={{ position: "relative", marginBottom: "1rem", maxWidth: "36rem" }}>
        <span style={{
          position: "absolute", left: "0.875rem", top: "50%",
          transform: "translateY(-50%)", fontSize: 15,
          color: "#9ca3af", pointerEvents: "none",
        }}>
          🔍
        </span>
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search recipes by title or description…"
          style={{
            width: "100%", padding: "0.75rem 2.5rem 0.75rem 2.75rem",
            border: "2px solid #e5e7eb", borderRadius: 12,
            fontSize: 15, outline: "none", boxSizing: "border-box",
            fontFamily: "inherit", transition: "border-color 0.2s",
          }}
          onFocus={e => (e.currentTarget.style.borderColor = "#86C540")}
          onBlur={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
        />
        {q && (
          <button
            onClick={clearSearch}
            title="Clear search"
            style={{
              position: "absolute", right: "0.75rem", top: "50%",
              transform: "translateY(-50%)",
              width: 22, height: 22, borderRadius: "50%",
              background: "#e5e7eb", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, color: "#6b7280", cursor: "pointer",
              fontWeight: 700, lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Filter row */}
      <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", alignItems: "center" }}>
        {/* Category */}
        <select
          value={initialCategory}
          onChange={e => handleSelect("category", e.target.value)}
          style={selectStyle}
        >
          <option value="">All categories</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Cook time */}
        <select
          value={initialCookTime}
          onChange={e => handleSelect("cookTime", e.target.value)}
          style={selectStyle}
        >
          {COOK_TIME_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={initialSort}
          onChange={e => handleSelect("sort", e.target.value)}
          style={selectStyle}
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearAll}
            style={{
              padding: "0.5rem 1rem",
              border: "1.5px solid #e5e7eb", borderRadius: 8,
              background: "#fff", color: "#6b7280",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "#dc2626";
              e.currentTarget.style.color = "#dc2626";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.color = "#6b7280";
            }}
          >
            ✕ Reset filters
          </button>
        )}
      </div>

      {/* Result count */}
      <p style={{ marginTop: "0.875rem", fontSize: "0.9375rem", color: "#6b7280" }}>
        {hasActiveFilters
          ? totalCount === 0
            ? "No recipes match your search"
            : `${totalCount} ${totalCount === 1 ? "recipe" : "recipes"} found`
          : `${totalCount} ${totalCount === 1 ? "recipe" : "recipes"}`}
      </p>
    </div>
  );
}
