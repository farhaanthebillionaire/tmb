
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Lightbulb, LogIn, Camera, SmilePlus, BarChartHorizontalBig, Rocket } from 'lucide-react';
import Image from 'next/image';

const steps = [
  {
    icon: <LogIn className="h-8 w-8 text-accent" />,
    title: '1. Sign Up in Seconds',
    description: 'Create your free account quickly and easily. No credit card required, ever!',
    imageSrc: "https://picsum.photos/400/300?random=6",
    imageHint: "registration form"
  },
  {
    icon: <Camera className="h-8 w-8 text-accent" />,
    title: '2. Log Your Meals Effortlessly',
    description: 'Snap a photo for AI analysis or simply type in your food items. Tracking has never been simpler.',
    imageSrc: "https://picsum.photos/400/300?random=7",
    imageHint: "meal logging"
  },
  {
    icon: <SmilePlus className="h-8 w-8 text-accent" />,
    title: '3. Track Your Mood',
    description: 'Log how you feel with our intuitive mood tracker. Understand the link between your diet and emotions.',
    imageSrc: "https://picsum.photos/400/300?random=8",
    imageHint: "mood tracking"
  },
  {
    icon: <BarChartHorizontalBig className="h-8 w-8 text-accent" />,
    title: '4. Discover AI Insights',
    description: 'Let our AI analyze your logs to reveal patterns and provide personalized suggestions for a healthier you.',
    imageSrc: "https://picsum.photos/400/300?random=9",
    imageHint: "data analytics"
  },
   {
    icon: <Rocket className="h-8 w-8 text-accent" />,
    title: '5. Reach Your Wellness Goals',
    description: 'Utilize reports, forecasts, and insights to stay motivated and make informed decisions on your health journey.',
    imageSrc: "https://picsum.photos/400/300?random=10",
    imageHint: "goal achievement"
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-primary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Getting Started is <span className="text-primary">Simple</span>
          </h2>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
            Follow these easy steps to begin your journey towards mindful eating and better well-being.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {steps.map((step, index) => (
            <Card key={index} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
              <CardHeader className="p-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-accent/10 flex-shrink-0">
                    {step.icon}
                    </div>
                    <CardTitle className="text-xl font-semibold text-foreground">{step.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 flex-grow flex flex-col">
                <Image 
                    src={step.imageSrc}
                    alt={step.title} 
                    width={400} 
                    height={200} 
                    className="w-full h-auto object-cover rounded-md mb-4 max-h-[200px]"
                    data-ai-hint={step.imageHint}
                  />
                <CardDescription className="text-muted-foreground">{step.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
