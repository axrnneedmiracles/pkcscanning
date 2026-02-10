'use server';
/**
 * @fileOverview Implements a Genkit flow to recognize car number plates from an image.
 *
 * - initiateScanWithPrompt - An asynchronous function that analyzes an image to find a license plate.
 * - InitiateScanWithPromptInput - Includes an optional prompt and the image data URI.
 * - InitiateScanWithPromptOutput - The recognized plate number.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InitiateScanWithPromptInputSchema = z.object({
  prompt: z.string().optional().describe('An optional hint about the plate to look for.'),
  photoDataUri: z.string().describe("The image of the vehicle/plate as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type InitiateScanWithPromptInput = z.infer<typeof InitiateScanWithPromptInputSchema>;

const InitiateScanWithPromptOutputSchema = z.object({
  plateNumber: z.string().describe('The recognized car number plate. Return empty string if not found.'),
});
export type InitiateScanWithPromptOutput = z.infer<typeof InitiateScanWithPromptOutputSchema>;

export async function initiateScanWithPrompt(input: InitiateScanWithPromptInput): Promise<InitiateScanWithPromptOutput> {
  return initiateScanWithPromptFlow(input);
}

const initiateScanWithPromptPrompt = ai.definePrompt({
  name: 'initiateScanWithPromptPrompt',
  input: {schema: InitiateScanWithPromptInputSchema},
  output: {schema: InitiateScanWithPromptOutputSchema},
  prompt: `You are an expert OCR system specializing in international vehicle license plates.

  Analyze the provided image and extract the primary vehicle license plate number.
  
  {{#if prompt}}User Hint: {{{prompt}}}{{/if}}
  Image: {{media url=photoDataUri}}
  
  Instructions:
  1. Locate the license plate in the image.
  2. Extract the text exactly as it appears.
  3. Clean the text of any small symbols or region codes if they are distinct from the main plate number.
  4. If multiple plates are visible, pick the most prominent one.
  5. If no plate is found, respond with an empty string for plateNumber.
  
  Respond ONLY with the JSON object containing the plateNumber.`,
});

const initiateScanWithPromptFlow = ai.defineFlow(
  {
    name: 'initiateScanWithPromptFlow',
    inputSchema: InitiateScanWithPromptInputSchema,
    outputSchema: InitiateScanWithPromptOutputSchema,
  },
  async input => {
    const {output} = await initiateScanWithPromptPrompt(input);
    return output!;
  }
);
