"use client";

import { useState } from "react";
import { parseIngredient } from "@/app/recipes/ingredientUtils";

// ── Amount parsing ──────────────────────────────────────────────────────────

function parseAmount(str: string): number {
  if (!str.trim()) return 0;
  const s = str.trim();
  // Mixed number: "1 1/2" — not produced by our parser, but handle defensively
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  // Fraction: "1/2"
  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  return parseFloat(s) || 0;
}

// Common fractions ordered so the closest match wins first
const FRACS: [number, number][] = [
  [1, 8], [1, 4], [1, 3], [3, 8], [1, 2], [5, 8], [2, 3], [3, 4], [7, 8],
];

function formatAmount(val: number): string {
  if (val <= 0) return "";

  const whole = Math.floor(val);
  const frac = val - whole;

  // Close enough to a whole number?
  if (frac < 0.04) return whole > 0 ? String(whole) : "";
  if (frac > 0.96) return String(whole + 1);

  // Match fractional part to a simple fraction
  for (const [n, d] of FRACS) {
    if (Math.abs(frac - n / d) < 0.04) {
      return whole > 0 ? `${whole} ${n}/${d}` : `${n}/${d}`;
    }
  }

  // Fall back to 1 decimal place
  const rounded = Math.round(val * 10) / 10;
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
}

// ── Component ───────────────────────────────────────────────────────────────

interface ServingsScalerProps {
  originalServings: number;
  ingredients: string[];
}

export function ServingsScaler({ originalServings, ingredients }: ServingsScalerProps) {
  const [servings, setServings] = useState(originalServings);

  const multiplier = servings / originalServings;
  const isScaled = Math.abs(multiplier - 1) > 0.001;

  // Multiplier label: "2x", "0.5x", etc.
  const multiplierLabel = isScaled
    ? `${Math.round(multiplier * 100) / 100}x`
    : null;

  function decrement() {
    setServings((s) => Math.max(1, s - 1));
  }

  function increment() {
    setServings((s) => s + 1);
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v) && v >= 1) setServings(v);
  }

  return (
    <div>
      {/* ── Scaler row ─────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.625rem",
        padding: "0.625rem 0.875rem",
        background: "#f9fafb",
        border: "1.5px solid #e5e7eb",
        borderRadius: 10,
        marginBottom: "1rem",
        flexWrap: "wrap",
      }}>
        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>
          Servings
        </span>

        {/* [-] input [+] */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <button
            type="button"
            onClick={decrement}
            disabled={servings <= 1}
            style={btnStyle(servings > 1)}
            onMouseEnter={e => { if (servings > 1) e.currentTarget.style.borderColor = "#86C540"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#d1d5db"; }}
          >
            −
          </button>

          <input
            type="number"
            min={1}
            value={servings}
            onChange={handleInput}
            style={{
              width: 46, height: 30, textAlign: "center",
              border: "1.5px solid #d1d5db", borderRadius: 7,
              fontSize: "0.9375rem", fontWeight: 700, color: "#111827",
              background: "#fff", outline: "none",
              fontFamily: "inherit",
              // Hide spinners
              MozAppearance: "textfield" as React.CSSProperties["MozAppearance"],
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "#86C540")}
            onBlur={e => (e.currentTarget.style.borderColor = "#d1d5db")}
          />

          <button
            type="button"
            onClick={increment}
            style={btnStyle(true)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#86C540"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#d1d5db"; }}
          >
            +
          </button>
        </div>

        {/* Multiplier badge */}
        {multiplierLabel && (
          <span style={{
            fontSize: "0.8125rem", fontWeight: 700,
            color: "#4a8f15",
            background: "rgba(134,197,64,0.12)",
            padding: "2px 8px", borderRadius: 20,
            whiteSpace: "nowrap",
          }}>
            {multiplierLabel}
          </span>
        )}

        {/* Reset */}
        {isScaled && (
          <button
            type="button"
            onClick={() => setServings(originalServings)}
            style={{
              marginLeft: "auto",
              fontSize: "0.8125rem", fontWeight: 600,
              color: "#6b7280", background: "#fff",
              border: "1.5px solid #e5e7eb",
              borderRadius: 7, padding: "3px 10px",
              cursor: "pointer", transition: "color 0.15s, border-color 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = "#374151";
              e.currentTarget.style.borderColor = "#9ca3af";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = "#6b7280";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* ── Ingredients list ────────────────────────────────────────────── */}
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {ingredients.map((ingredient, index) => {
          const parsed = parseIngredient(ingredient);
          const originalAmt = parseAmount(parsed.amount);
          const canScale = !!parsed.amount && originalAmt > 0;
          const scaledAmt = canScale ? originalAmt * multiplier : originalAmt;
          const displayAmt = canScale && isScaled ? formatAmount(scaledAmt) : parsed.amount;
          const measure = [displayAmt, parsed.unit].filter(Boolean).join(" ");
          const nameText = parsed.name || (!measure ? ingredient : "");
          const modified = canScale && isScaled;

          return (
            <li key={index} style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
              <span style={{ color: "#d1d5db", flexShrink: 0, lineHeight: 1.6 }}>•</span>
              <span>
                {measure && (
                  <strong style={{
                    fontWeight: 700,
                    marginRight: "0.35rem",
                    color: modified ? "#4a8f15" : "#111827",
                    transition: "color 0.2s",
                  }}>
                    {measure}
                  </strong>
                )}
                <span style={{ color: "#374151" }}>{nameText}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <style>{`
        /* Hide number input spinners */
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  );
}

function btnStyle(enabled: boolean): React.CSSProperties {
  return {
    width: 30, height: 30, borderRadius: "50%",
    border: "1.5px solid #d1d5db", background: "#fff",
    color: "#374151", fontWeight: 700, fontSize: 17,
    cursor: enabled ? "pointer" : "not-allowed",
    opacity: enabled ? 1 : 0.35,
    display: "flex", alignItems: "center", justifyContent: "center",
    lineHeight: 1, transition: "border-color 0.15s",
    flexShrink: 0,
  };
}
