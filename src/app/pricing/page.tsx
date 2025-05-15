import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Check, PartyPopper } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {/* Reduced bottom padding */}
      <main className="flex-grow bg-primary/5 py-16 md:py-24 pb-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Our <span className="text-primary">Amazing</span> Plan!
            </h1>
            <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
              Guess what? Everything is on the house! That&apos;s right, all features, totally free.
              No catches, no credit card needed, just pure, unadulterated food tracking joy.
            </p>
          </div>
          <div className="flex justify-center">
            <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300 flex flex-col max-w-md border-2 border-primary">
              <CardHeader className="p-6 text-center">
                <div className="mx-auto mb-4 text-primary">
                  <PartyPopper className="h-16 w-16" />
                </div>
                <CardTitle className="text-3xl font-semibold text-primary">Absolutely Free!</CardTitle>
                <CardDescription className="text-xl text-muted-foreground mt-2">
                  Seriously. We&apos;re not kidding. It&apos;s all free.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 flex-grow">
                <ul className="space-y-3 text-lg">
                  {[
                    'Unlimited Food Logging',
                    'Unlimited AI Plate Analysis',
                    'Mood-Food Insights & Patterns',
                    'Calorie Forecasts & Tracking',
                    'Leaderboard Participation',
                    'Full Access to Reports',
                    'All Future Updates',
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-center text-muted-foreground mt-8 text-lg italic">
                  &quot;Why is it free?&quot; you ask. Our AI is powered by leftover pizza crusts and good vibes. Turns out, that&apos;s pretty cost-effective!
                </p>
              </CardContent>
              <CardFooter className="p-6 mt-auto">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg" asChild>
                  <Link href="/register">
                    Get Started - It&apos;s Free!
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
