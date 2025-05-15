// import {genkit} from 'genkit';
// import {googleAI} from '@genkit-ai/googleai';

// export const ai = genkit({
//   plugins: [googleAI()],
//   model: 'googleai/gemini-2.0-flash',
// });



import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Ensure GOOGLE_GENAI_API_KEY is being read from process.env
// This log helps verify if the key is available at the time of plugin initialization
if (process.env.NODE_ENV === 'development') { // Only log in development
    console.log('[Genkit Init] Attempting to use GOOGLE_GENAI_API_KEY:', 
        process.env.GOOGLE_GENAI_API_KEY ? 'Key Present (masked last 4): ********' + String(process.env.GOOGLE_GENAI_API_KEY).slice(-4) : 'Key NOT Present or Empty'
    );
}

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY }) // Explicitly pass the API key
  ],
  model: 'gemini-pro-vision', // Changed default model back to gemini-pro-vision
});

