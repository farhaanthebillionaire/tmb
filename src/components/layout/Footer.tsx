
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Footer() {
  return (
    <footer className={cn(
      "w-full border-t border-border/40 py-6 text-sm text-muted-foreground bg-background",
      // Adjusted padding for when sidebar is present. These CSS vars are defined in SidebarProvider.
      // On pages without SidebarProvider (landing, auth), these vars won't be defined, and padding will be normal.
      "md:pl-[var(--sidebar-width-icon)] group-data-[sidebar-state=expanded]/sidebar-wrapper:md:pl-[var(--sidebar-width)]",
      "transition-[padding-left] duration-300 ease-in-out"
      // mt-auto is removed as parent flex layout handles pushing it down
    )}>
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-y-2 sm:gap-x-4">
        <p className="text-center sm:text-left order-1 sm:order-1 sm:ml-4">
          &copy; {new Date().getFullYear()} TrackMyBite. All rights reserved.
        </p>
        <p className="text-center order-2 sm:order-2">
          Created by{' '}
          <Link
            href="https://www.instagram.com/farhaanthebillionaire/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            Shaik Mohammed Farhaan
          </Link>
        </p>
        <div className="flex items-center space-x-4 sm:space-x-6 text-center sm:text-right order-3 sm:order-3 sm:mr-4">
          <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-primary">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
