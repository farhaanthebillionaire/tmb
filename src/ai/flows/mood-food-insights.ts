'use server';
/**
 * @fileOverview Analyzes mood and food logs to identify patterns and provide AI-powered suggestions for healthier eating habits.
 *
 * - getMoodFoodInsights - A function that handles the analysis and suggestion process.
 * - MoodFoodInsightsInput - The input type for the getMoodFoodInsights function.
 * - MoodFoodInsightsOutput - The return type for the getMoodFoodInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MoodFoodInsightsInputSchema = z.object({
  moodLogs: z
    .array(z.object({
      timestamp: z.string().describe('Timestamp of the mood log entry.'),
      mood: z.string().describe('The mood recorded (e.g., happy, sad, stressed).'),
    }))
    .describe('A list of mood logs with timestamps and mood descriptions.'),
  foodLogs: z
    .array(z.object({
      timestamp: z.string().describe('Timestamp of the food log entry.'),
      foodItems: z.array(z.string()).describe('List of food items consumed.'),
    }))
    .describe('A list of food logs with timestamps and lists of food items consumed.'),
});
export type MoodFoodInsightsInput = z.infer<typeof MoodFoodInsightsInputSchema>;

const MoodFoodInsightsOutputSchema = z.object({
  patterns: z
    .array(z.string())
    .describe('Identified patterns between mood and food intake.'),
  suggestions: z
    .array(z.string())
    .describe('AI-powered suggestions for healthier eating habits based on the identified patterns.'),
});
export type MoodFoodInsightsOutput = z.infer<typeof MoodFoodInsightsOutputSchema>;

export async function getMoodFoodInsights(input: MoodFoodInsightsInput): Promise<MoodFoodInsightsOutput> {
  return moodFoodInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moodFoodInsightsPrompt',
  input: {schema: MoodFoodInsightsInputSchema},
  output: {schema: MoodFoodInsightsOutputSchema},
  prompt: `You are an AI-powered health and wellness assistant. Analyze the provided mood and food logs to identify patterns and provide personalized suggestions for healthier eating habits to improve overall well-being.

Mood Logs:
{{#each moodLogs}}
- Timestamp: {{timestamp}}, Mood: {{mood}}
{{/each}}

Food Logs:
{{#each foodLogs}}
- Timestamp: {{timestamp}}, Food Items: {{#each foodItems}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/each}}

Identify patterns between mood and food intake and provide specific suggestions for healthier eating habits.
`, 
});

const moodFoodInsightsFlow = ai.defineFlow(
  {
    name: 'moodFoodInsightsFlow',
    inputSchema: MoodFoodInsightsInputSchema,
    outputSchema: MoodFoodInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
