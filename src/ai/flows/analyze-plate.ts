// src/ai/flows/analyze-plate.ts
'use server';
/**
 * @fileOverview AI agent that analyzes a plate of food to estimate calorie count and nutritional content.
 *
 * - analyzePlate - A function that handles the plate analysis process.
 * - AnalyzePlateInput - The input type for the analyzePlate function.
 * - AnalyzePlateOutput - The return type for the analyzePlate function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzePlateInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plate, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzePlateInput = z.infer<typeof AnalyzePlateInputSchema>;

const AnalyzePlateOutputSchema = z.object({
  calorieEstimate: z
    .number()
    .describe('The estimated calorie count of the food on the plate.'),
  nutritionalContent: z
    .string()
    .describe('A description of the nutritional content of the food.'),
  plateHealthScore: z
    .number()
    .describe('A score indicating the overall healthiness of the plate.'),
});
export type AnalyzePlateOutput = z.infer<typeof AnalyzePlateOutputSchema>;

export async function analyzePlate(input: AnalyzePlateInput): Promise<AnalyzePlateOutput> {
  return analyzePlateFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePlatePrompt',
  input: {schema: AnalyzePlateInputSchema},
  output: {schema: AnalyzePlateOutputSchema},
  prompt: `You are a nutrition expert analyzing a plate of food.

You will receive a photo of the plate and must estimate the calorie count, describe the nutritional content, and provide a plate health score (out of 100).

Analyze the following plate:

{{media url=photoDataUri}}

Respond in JSON format.
`,
});

const analyzePlateFlow = ai.defineFlow(
  {
    name: 'analyzePlateFlow',
    inputSchema: AnalyzePlateInputSchema,
    outputSchema: AnalyzePlateOutputSchema,
  },
  async input => {
    try {
      console.log('[analyzePlateFlow] Attempting to call AI prompt with input:', { photoDataUriPresent: !!input.photoDataUri });
      const {output} = await prompt(input);
      if (!output) {
        console.error('[analyzePlateFlow] LLM call succeeded but output is undefined or null.');
        throw new Error('LLM returned no valid output for plate analysis.');
      }
      console.log('[analyzePlateFlow] AI prompt call successful.');
      return output;
    } catch (flowError: any) {
      console.error('************************************************************');
      console.error('[analyzePlateFlow] Error directly within Genkit flow:', flowError.message);
      if (flowError.stack) {
        console.error('[analyzePlateFlow] Stack trace:', flowError.stack);
      }
      if (flowError.cause) {
        console.error('[analyzePlateFlow] Cause of error:', flowError.cause);
      }
      if (flowError.details) { // Genkit errors often have a details field
        console.error('[analyzePlateFlow] Error details:', flowError.details);
      }
      if (flowError.response?.data) { // Sometimes API errors are nested here
          console.error('[analyzePlateFlow] Error response data:', flowError.response.data);
      }
      console.error('************************************************************');
      // Throw a new, simpler error object containing only the message.
      // This helps ensure serializability if flowError itself is complex.
      throw new Error(flowError.message || 'Genkit flow for plate analysis failed.');
    }
  }
);

// Note: The client-side components (FoodLoggingCard, PlateAnalysisCard)
// handle image previews locally in the browser using FileReader.
// This data URI is then passed to this server action.
// No persistent storage of the image is implemented in this flow or the calling components by default.
// If storage were required, it would need explicit implementation (e.g., uploading to Firebase Storage).
