import { cn } from '@/lib/utils';
import type React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GlassCard({ className, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        'glassmorphic rounded-xl p-6 shadow-lg', // Ensure globals.css has .glassmorphic
        // Softer glass effect for lighter theme:
        'bg-card/70 backdrop-blur-md saturate-150 border border-border/20',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
