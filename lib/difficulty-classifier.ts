/**
 * lib/difficulty-classifier.ts — Recipe Difficulty Scorer
 *
 * Analyzes recipe instructions and scores difficulty as
 * Easy / Medium / Hard based on cooking technique keywords.
 * Pure TypeScript — no external dependencies, runs on Vercel.
 */

const EASY_TECHNIQUES = new Set([
  "mix", "stir", "combine", "add", "pour", "place", "put",
  "heat", "boil", "bake", "cook", "wash", "chop", "slice",
  "dice", "peel", "season", "serve", "spread", "melt",
  "toast", "rinse", "drain", "toss", "whisk", "blend",
  "microwave", "refrigerate", "freeze", "sprinkle", "cut",
  "open", "cover", "uncover", "remove", "transfer", "cool",
]);

const MEDIUM_TECHNIQUES = new Set([
  "saute", "sauté", "simmer", "roast", "grill", "fry",
  "marinate", "knead", "fold", "reduce", "caramelize",
  "deglaze", "blanch", "braise", "broil", "poach",
  "smoke", "glaze", "score", "rest", "proof",
  "emulsify", "sweat", "render", "flambe", "flambé",
  "sear", "brown", "crisp", "char", "infuse",
]);

const HARD_TECHNIQUES = new Set([
  "temper", "julienne", "brunoise", "chiffonade", "clarify",
  "confit", "cure", "debone", "ferment", "fillet",
  "foam", "gel", "laminate", "liaison", "mount",
  "parboil", "roux", "spatchcock", "tartare", "terrine",
  "veloute", "veloutée", "spherification", "sous vide",
  "quenelle", "mirepoix", "nappe", "meuniere",
]);

export type Difficulty = "Easy" | "Medium" | "Hard" | "Unknown";

export interface DifficultyResult {
  difficulty: Difficulty;
  score: number;
  techniquesFound: { technique: string; level: "easy" | "medium" | "hard" }[];
  easyCount: number;
  mediumCount: number;
  hardCount: number;
}

export function scoreDifficulty(instructions: string[]): DifficultyResult {
  if (!instructions || instructions.length === 0) {
    return {
      difficulty: "Unknown",
      score: 0,
      techniquesFound: [],
      easyCount: 0,
      mediumCount: 0,
      hardCount: 0,
    };
  }

  // Join all instructions and normalize
  const text = instructions
    .join(" ")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ");

  const words = text.split(/\s+/).filter(Boolean);

  let easyCount = 0;
  let mediumCount = 0;
  let hardCount = 0;
  const techniquesFound: DifficultyResult["techniquesFound"] = [];

  for (const word of words) {
    if (HARD_TECHNIQUES.has(word)) {
      hardCount++;
      techniquesFound.push({ technique: word, level: "hard" });
    } else if (MEDIUM_TECHNIQUES.has(word)) {
      mediumCount++;
      techniquesFound.push({ technique: word, level: "medium" });
    } else if (EASY_TECHNIQUES.has(word)) {
      easyCount++;
    }
  }

  // Weighted score 0-100
  const totalWords = words.length;
  const score = Math.min(
    100,
    Math.round(((hardCount * 4 + mediumCount * 2) / totalWords) * 300)
  );

  // Determine difficulty
  let difficulty: Difficulty;
  if (hardCount >= 2 || score >= 60) {
    difficulty = "Hard";
  } else if (mediumCount >= 2 || score >= 20) {
    difficulty = "Medium";
  } else {
    difficulty = "Easy";
  }

  return {
    difficulty,
    score,
    techniquesFound,
    easyCount,
    mediumCount,
    hardCount,
  };
}