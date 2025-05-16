
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Heart, ShieldCheck, Gift } from 'lucide-react';
import Image from 'next/image';
import commitmentImage from '@/img/13.jpg'; // Import local image

export function CommitmentSection() {
  return (
    <section id="commitment" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Our <span className="text-primary">Commitment</span> to You
          </h2>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
            We believe that everyone deserves access to tools that promote well-being. That&apos;s why Track My Bite is, and always will be, completely free.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10 text-primary flex-shrink-0">
                <Gift className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">Absolutely Free, Forever</h3>
                <p className="text-muted-foreground mt-1">
                  Access all features including AI analysis, mood tracking, and detailed reports without any hidden fees or premium subscriptions. Your wellness journey shouldn't have a price tag.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10 text-primary flex-shrink-0">
                <Heart className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">Focused on Your Well-being</h3>
                <p className="text-muted-foreground mt-1">
                  Our primary goal is to empower you with insights and tools to make healthier choices. We&apos;re dedicated to supporting your path to mindful eating and a balanced lifestyle.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10 text-primary flex-shrink-0">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">Your Data, Your Control</h3>
                <p className="text-muted-foreground mt-1">
                  We respect your privacy. Your personal data is used solely to provide and improve your experience within the app. We are committed to transparency and data security.
                </p>
              </div>
            </div>
             <div className="mt-8 text-center md:text-left">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                    <Link href="/register">
                    Join Track My Bite Today!
                    </Link>
                </Button>
            </div>
          </div>
          <div className="hidden md:block">
            <Image
              src={commitmentImage} // Use imported local image
              alt="Commitment to well-being"
              width={500}
              height={500}
              className="rounded-xl shadow-xl object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
