// // src/app/api/genkit/[...slug]/route.ts
// // import { genkitApi } from '@genkit-ai/next';
// import genkitApi from '@genkit-ai/next';

// import '@/ai/dev'; // This should import your flow definitions

// export const { GET, POST, OPTIONS } = genkitApi();
import genkitApi from '@genkit-ai/next';
import '@/ai/dev'; // Your flow definitions

export const GET = genkitApi;
export const POST = genkitApi;
export const OPTIONS = genkitApi;
