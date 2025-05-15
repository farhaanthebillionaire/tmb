import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <div className="flex items-center justify-between w-full">
          <Link href="/" className="flex items-center space-x-2 ml-4"> {/* Added ml-4 here */}
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl text-primary">TrackMyBite</span>
          </Link>
          <nav className="flex items-center space-x-4 sm:space-x-6">
            <Button variant="ghost" asChild>
              <Link href="/#features">Features</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button variant="accent" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/login">Get Started</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
