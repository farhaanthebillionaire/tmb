
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { CommitmentSection } from '@/components/landing/CommitmentSection';

export default function LandingPage() {
  return (
    // The body tag itself is now flex flex-col min-h-screen from globals.css
    <> 
      <Navbar />
      {/* flex-grow will make this main section take available space, pushing footer down */}
      <main className="flex-grow pb-8">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CommitmentSection />
      </main>
      <Footer />
    </>
  );
}
