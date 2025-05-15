
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BrainCircuit, Camera, Smile, BarChart3, Zap } from 'lucide-react';
import Image from 'next/image';

const features = [
  {
    icon: <Camera className="h-8 w-8 text-accent" />,
    title: 'AI Plate Analysis',
    description: 'Snap a photo of your meal and let our AI estimate calorie count, nutritional content, and provide a Plate Health Score.',
    imageSrc: "https://picsum.photos/400/300?random=2",
    imageHint: "healthy food"
  },
  {
    icon: <Zap className="h-8 w-8 text-accent" />,
    title: 'Versatile Food Logging',
    description: 'Log food your way: image upload or text input. Quick and easy meal tracking.',
    imageSrc: "https://picsum.photos/400/300?random=3",
    imageHint: "fitness tracking"
  },
  {
    icon: <Smile className="h-8 w-8 text-accent" />,
    title: 'Mood-Food Tracking',
    description: 'Track your mood alongside meals with intuitive emoji sliders. Discover patterns with AI-powered insights.',
    imageSrc: "https://picsum.photos/400/300?random=4",
    imageHint: "wellness balance"
  },
  {
    icon: <BarChart3 className="h-8 w-8 text-accent" />,
    title: 'Calorie Forecast Display',
    description: 'Visualize your daily calorie intake and forecasts with dynamic bar animations, helping you stay on track.',
    imageSrc: "https://picsum.photos/400/300?random=5",
    imageHint: "progress chart"
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Why <span className="text-primary">TrackMyBite</span>?</h2>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
            Unlock a deeper understanding of your nutrition and well-being with our smart, intuitive features.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
              <CardHeader className="flex flex-row items-start gap-4 p-6">
                <div className="p-3 rounded-full bg-accent/10 flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-foreground">{feature.title}</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">{feature.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-grow">
                 <Image 
                    src={feature.imageSrc}
                    alt={feature.title} 
                    width={400} 
                    height={250} 
                    className="w-full h-auto object-cover max-h-[250px]"
                    data-ai-hint={feature.imageHint}
                  />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

