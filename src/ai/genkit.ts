import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { genkitApi } from '@genkit-ai/next';


export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});




