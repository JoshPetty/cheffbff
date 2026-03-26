import { Navigation } from "@/app/components/Navigation/Navigation";
import { Footer } from "@/app/components/Footer/Footer";
import { RecipeForm } from "./components/RecipeForm";

export default function NewRecipePage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main style={{ paddingTop: '5rem', paddingBottom: '4rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '3rem 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ 
              fontSize: '3rem', 
              fontWeight: '700', 
              color: '#111827',
              marginBottom: '0.5rem'
            }}>
              Share Your Recipe
            </h1>
            <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>
              Add a new recipe to inspire the community
            </p>
          </div>
          
          <RecipeForm />
        </div>
      </main>

      <Footer />
    </div>
  );
}