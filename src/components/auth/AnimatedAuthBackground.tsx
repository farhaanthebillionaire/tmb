// src/components/auth/AnimatedAuthBackground.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Apple, Banana, Carrot, Pizza, Salad, Sandwich, Soup } from 'lucide-react'; // Example food icons

const foodIcons = [
  Apple,
  Banana,
  Carrot,
  Pizza,
  // Salad, // Lucide does not have a Salad icon, using Soup instead or could be an SVG
  Soup, 
  Sandwich,
];

interface FloatingItem {
  id: number;
  Icon: React.ElementType;
  style: React.CSSProperties;
  animationDelay: string;
}

export function AnimatedAuthBackground() {
  const [items, setItems] = useState<FloatingItem[]>([]);

  useEffect(() => {
    const generateItems = () => {
      const newItems: FloatingItem[] = [];
      const numItems = 15; // Number of floating items

      for (let i = 0; i < numItems; i++) {
        const IconComponent = foodIcons[Math.floor(Math.random() * foodIcons.length)];
        const size = Math.random() * 30 + 20; // Random size between 20px and 50px
        newItems.push({
          id: i,
          Icon: IconComponent,
          style: {
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${size}px`,
            height: `${size}px`,
            opacity: Math.random() * 0.5 + 0.2, // Random opacity
          },
          animationDelay: `${Math.random() * 5}s`, // Random animation delay
        });
      }
      setItems(newItems);
    };

    generateItems();
    // Interval to regenerate items for a dynamic feel, optional
    // const intervalId = setInterval(generateItems, 10000);
    // return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {items.map((item) => (
        <item.Icon
          key={item.id}
          className="text-primary/30 food-item-float"
          style={{ ...item.style, animationDelay: item.animationDelay }}
        />
      ))}
    </div>
  );
}
