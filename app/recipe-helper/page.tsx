import { Navigation } from "@/app/components/Navigation/Navigation";
import { Footer } from "@/app/components/Footer/Footer";
import { RecipeHelperForm } from "./components/RecipeHelperForm";

export default function RecipeHelperPage() {
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
               Pantry to Plate
            </h1>
            <p style={{ fontSize: '1.25rem', color: '#6b7280' }}>
              Tell us what ingredients you have, and we'll suggest delicious recipes you can make!
            </p>
          </div>
          
          <RecipeHelperForm />
        </div>
      </main>

      <Footer />
    </div>
  );
}