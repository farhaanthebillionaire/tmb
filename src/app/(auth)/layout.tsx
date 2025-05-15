// src/app/(auth)/layout.tsx
import { AnimatedAuthBackground } from '@/components/auth/AnimatedAuthBackground';
import { Footer } from '@/components/layout/Footer';
import { FoodLogProvider } from '@/contexts/FoodLogContext'; // Import the provider

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The body tag itself is now flex flex-col min-h-screen from globals.css
    <FoodLogProvider> {/* Wrap with FoodLogProvider */}
      <div className="flex flex-col min-h-screen"> {/* Ensure layout structure for sticky footer */}
        <AnimatedAuthBackground />
        {/* flex-grow will make this main section take available space */}
        <main className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <Footer />
      </div>
    </FoodLogProvider>
  );
}
