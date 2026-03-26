import { createClient } from "@/lib/supabase";
import { Navigation } from "./components/Navigation/Navigation";
import { Hero } from "./components/Hero/Hero";
import { FeaturedRecipes } from "./components/FeaturedRecipes/FeaturedRecipes";
import { Footer } from "./components/Footer/Footer";

export default async function HomePage() {
  const supabase = createClient();
  
  const { data: recipes } = await supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <FeaturedRecipes recipes={recipes || []} />
      <Footer />
    </div>
  );
}