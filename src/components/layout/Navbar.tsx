
'use client'; // Required for onClick handlers and state

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader, // Import SheetHeader
  SheetTitle,   // Import SheetTitle
} from '@/components/ui/sheet';
import { UtensilsCrossed, Menu as MenuIcon } from 'lucide-react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Determine if we are on an auth page to potentially hide the navbar
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/complete-profile' || pathname === '/forgot-password';

  if (isAuthPage) {
    return null; // Don't render Navbar on auth pages
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <div className="flex items-center justify-between w-full">
          <Link href="/" className="flex items-center space-x-2 ml-4">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl text-primary">TrackMyBite</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2 md:space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/#features">Features</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button variant="accent" asChild>
              <Link href="/register">Login / SignUp</Link>
            </Button>
          </nav>

          {/* Mobile Navigation Trigger */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MenuIcon className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0 pt-6"> {/* Changed padding to p-0 pt-6 */}
                <SheetHeader className="px-6 pb-4 border-b"> {/* Added SheetHeader with bottom border */}
                  <SheetTitle>
                    <span className="sr-only">Main Menu</span> {/* Visually hidden but accessible title */}
                    <Link href="/" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
                      <UtensilsCrossed className="h-6 w-6 text-primary" />
                      <span className="font-bold text-xl text-primary">TrackMyBite</span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-5 mt-5 px-6"> {/* Added px-6 to content */}
                  <SheetClose asChild>
                    <Link
                      href="/#features"
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Features
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/pricing"
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Pricing
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button variant="accent" className="w-full py-3 text-base" asChild>
                      <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                        Get Started
                      </Link>
                    </Button>
                  </SheetClose>
                   <SheetClose asChild>
                     <Button variant="outline" className="w-full py-3 text-base" asChild>
                        <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                            Login
                        </Link>
                     </Button>
                   </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
