// src/app/layout.tsx
'use client'; // Make RootLayout a client component to use useEffect for theme

// import type { Metadata } from 'next'; // Metadata is handled differently for client root layouts
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from "@/components/ui/tooltip";
import { GeistSans } from 'geist/font/sans';
import React, { useEffect } from 'react'; // Import React and useEffect

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // Function to apply the theme
    const applyThemePreference = () => {
      let preferredTheme = localStorage.getItem('theme');

      if (preferredTheme !== 'light' && preferredTheme !== 'dark') {
        // No valid theme in localStorage, check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          preferredTheme = 'dark';
        } else {
          preferredTheme = 'light';
        }
        // For system preference, we don't save to localStorage initially.
        // The user's explicit choice in settings WILL save to localStorage.
      }

      if (preferredTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyThemePreference();

    // Listen for changes in system color scheme if you want the app to adapt
    // dynamically when no user preference is set in localStorage.
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const systemThemeChangeHandler = (e: MediaQueryListEvent) => {
        // Only update if no theme is explicitly set by the user in localStorage
        if (!localStorage.getItem('theme')) { 
            if (e.matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    };

    mediaQuery.addEventListener('change', systemThemeChangeHandler);

    // Cleanup listener on component unmount
    return () => {
      mediaQuery.removeEventListener('change', systemThemeChangeHandler);
    };

  }, []); // Empty dependency array ensures this runs once on mount

  return (
    // The classList on <html> is managed by the useEffect above
    <html lang="en" className={`${GeistSans.variable} h-full`}>
      <head>
        {/* Standard head elements like favicons, etc. can go here */}
        <title>Track My Bite - Mindful Eating, Simplified</title>
        <meta name="description" content="Analyze your meals, track your mood, and understand your eating habits with AI-powered insights. Start your journey to healthier eating today!" />
      </head>
      <body className="antialiased">
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
