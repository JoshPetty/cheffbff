export interface IngredientField {
  amount: string;
  unit: string;
  name: string;
}

export const UNITS = [
  "",
  "tsp", "tbsp", "cup",
  "oz", "fl oz", "lb",
  "g", "kg", "ml", "L",
  "pinch", "slice", "piece", "clove", "bunch", "handful",
  "to taste",
];

// Plural / alternate spellings → canonical unit
const UNIT_VARIANTS: Record<string, string> = {
  cups: "cup",
  tsps: "tsp",
  tablespoon: "tbsp", tablespoons: "tbsp",
  teaspoon: "tsp",   teaspoons: "tsp",
  ounce: "oz",       ounces: "oz",
  pound: "lb",       pounds: "lb",
  gram: "g",         grams: "g",
  liter: "L",        liters: "L",
  litre: "L",        litres: "L",
  milliliter: "ml",  milliliters: "ml",
  millilitre: "ml",  millilitres: "ml",
  pinches: "pinch",
  slices: "slice",
  pieces: "piece",
  cloves: "clove",
  bunches: "bunch",
  handfuls: "handful",
};

const UNIT_SET = new Set([...UNITS.filter(Boolean).map((u) => u.toLowerCase())]);

function resolveUnit(word: string): string | null {
  const lower = word.toLowerCase();
  if (UNIT_SET.has(lower)) return lower === "l" ? "L" : lower;
  return UNIT_VARIANTS[lower] ?? null;
}

export function parseIngredient(str: string): IngredientField {
  const s = str.trim();
  if (!s) return { amount: "", unit: "", name: "" };

  // Handle "to taste" anywhere in the string
  if (/\bto\s+taste\b/i.test(s)) {
    const name = s.replace(/\bto\s+taste\b/i, "").replace(/^\W+|\W+$/g, "").trim();
    return { amount: "", unit: "to taste", name };
  }

  const tokens = s.split(/\s+/);

  // Leading number? (handles decimals and fractions like 1/2)
  let amountStr = "";
  let rest = tokens;
  if (/^[\d./]+$/.test(tokens[0])) {
    amountStr = tokens[0];
    rest = tokens.slice(1);
  }

  if (!rest.length) return { amount: amountStr, unit: "", name: "" };

  // Two-word unit "fl oz"
  if (
    rest[0].toLowerCase() === "fl" &&
    rest[1]?.toLowerCase() === "oz"
  ) {
    return { amount: amountStr, unit: "fl oz", name: rest.slice(2).join(" ") };
  }

  // Single-word unit
  const canonical = resolveUnit(rest[0]);
  if (canonical) {
    return { amount: amountStr, unit: canonical, name: rest.slice(1).join(" ") };
  }

  // No unit matched
  return { amount: amountStr, unit: "", name: rest.join(" ") };
}

export function formatIngredient({ amount, unit, name }: IngredientField): string {
  return [amount.trim(), unit.trim(), name.trim()].filter(Boolean).join(" ");
}

export const emptyIngredient = (): IngredientField => ({ amount: "", unit: "", name: "" });
