"use client";

import type { IngredientField } from "./ingredientUtils";
import { UNITS } from "./ingredientUtils";

interface IngredientRowProps {
  field: IngredientField;
  onChange: (field: IngredientField) => void;
  onRemove: () => void;
  showRemove: boolean;
}

const base: React.CSSProperties = {
  border: "1.5px solid #e5e7eb",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  color: "#111827",
  background: "#fafafa",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.2s",
};

export function IngredientRow({ field, onChange, onRemove, showRemove }: IngredientRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        marginBottom: "0.625rem",
        flexWrap: "wrap",
      }}
    >
      {/* Amount */}
      <input
        type="text"
        inputMode="decimal"
        placeholder="Amt"
        value={field.amount}
        onChange={(e) => onChange({ ...field, amount: e.target.value })}
        style={{ ...base, width: 70, flexShrink: 0, textAlign: "center" }}
      />

      {/* Unit */}
      <select
        value={field.unit}
        onChange={(e) => onChange({ ...field, unit: e.target.value })}
        style={{ ...base, width: 120, flexShrink: 0, cursor: "pointer" }}
      >
        {UNITS.map((u) => (
          <option key={u} value={u}>
            {u === "" ? "(none)" : u}
          </option>
        ))}
      </select>

      {/* Name */}
      <input
        type="text"
        placeholder="Ingredient name"
        value={field.name}
        onChange={(e) => onChange({ ...field, name: e.target.value })}
        style={{ ...base, flex: 1, minWidth: 120 }}
      />

      {/* Remove */}
      {showRemove && (
        <button
          type="button"
          onClick={onRemove}
          title="Remove ingredient"
          style={{
            flexShrink: 0,
            width: 34,
            height: 34,
            borderRadius: 8,
            border: "1.5px solid #fecaca",
            background: "#fff",
            color: "#dc2626",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
