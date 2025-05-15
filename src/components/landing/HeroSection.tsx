
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-background to-primary/10">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
            Transform Your <span className="text-primary">Eating Habits</span>,
            <br /> One Bite at a Time.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10">
            TrackMyBite uses AI to analyze your meals, understand your mood-food connection, and guide you towards a healthier, more mindful lifestyle.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <Link href="/dashboard">
                Start Tracking Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10" asChild>
              <Link href="/#features">
                Learn More
              </Link>
            </Button>
          </div>
        </div>
        <div className="mt-16 md:mt-24 relative">
          <Image
            src="https://picsum.photos/1200/600?random=1"
            alt="TrackMyBite Dashboard Preview"
            width={1200}
            height={600}
            className="rounded-xl shadow-2xl mx-auto object-cover"
            data-ai-hint="fitness app"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent rounded-xl"></div>
        </div>
      </div>
    </section>
  );
}

