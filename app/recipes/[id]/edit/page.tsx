import { createClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { Navigation } from "@/app/components/Navigation/Navigation";
import { Footer } from "@/app/components/Footer/Footer";
import { EditRecipeForm } from "./EditRecipeForm";
import Link from "next/link";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createClient();

  const { data: recipe } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single();

  if (!recipe) notFound();

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main style={{ paddingTop: "5rem", paddingBottom: "4rem" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "3rem 2rem" }}>
          <Link
            href={`/recipes/${id}`}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              color: "#86C540", fontWeight: 600, marginBottom: "2rem",
              textDecoration: "none",
            }}
          >
            ← Back to Recipe
          </Link>

          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h1 style={{ fontSize: "3rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>
              Edit Recipe
            </h1>
            <p style={{ fontSize: "1.125rem", color: "#6b7280" }}>
              Update your recipe details below
            </p>
          </div>

          <EditRecipeForm recipe={recipe} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
