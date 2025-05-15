
import type { Metadata } from 'next';
import './globals.css'; // This should contain the @tailwind directives and base styles
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from "@/components/ui/tooltip";
import { GeistSans } from 'geist/font/sans';

export const metadata: Metadata = {
  title: 'TrackMyBite - Mindful Eating, Simplified',
  description: 'Analyze your meals, track your mood, and understand your eating habits with AI-powered insights. Start your journey to healthier eating today!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} h-full`}>
      {/* body tag has 'flex flex-col min-h-screen' applied via globals.css now */}
      <body className="antialiased"> 
        <TooltipProvider>
          {/* Children will be rendered within the flex container */}
          {children}
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
