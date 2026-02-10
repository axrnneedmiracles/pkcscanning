'use server';
/**
 * @fileOverview Implements a Genkit flow to initiate a car number plate scan based on a user-provided prompt.
 *
 * - initiateScanWithPrompt - An asynchronous function that initiates the scan and returns the recognized plate number.
 * - InitiateScanWithPromptInput - The input type for the initiateScanWithPrompt function, including the user prompt.
 * - InitiateScanWithPromptOutput - The output type for the initiateScanWithPrompt function, containing the recognized plate number.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InitiateScanWithPromptInputSchema = z.object({
  prompt: z.string().describe('A prompt describing the plate to look for.'),
});
export type InitiateScanWithPromptInput = z.infer<typeof InitiateScanWithPromptInputSchema>;

const InitiateScanWithPromptOutputSchema = z.object({
  plateNumber: z.string().describe('The recognized car number plate.'),
});
export type InitiateScanWithPromptOutput = z.infer<typeof InitiateScanWithPromptOutputSchema>;

export async function initiateScanWithPrompt(input: InitiateScanWithPromptInput): Promise<InitiateScanWithPromptOutput> {
  return initiateScanWithPromptFlow(input);
}

const initiateScanWithPromptPrompt = ai.definePrompt({
  name: 'initiateScanWithPromptPrompt',
  input: {schema: InitiateScanWithPromptInputSchema},
  output: {schema: InitiateScanWithPromptOutputSchema},
  prompt: `You are an AI assistant designed to recognize car number plates based on user prompts.

  The user will provide a prompt describing the plate they are looking for.
  Your task is to extract the plate number from the scene based on the prompt and return it.

  Prompt: {{{prompt}}}
  
  Respond with just the plate number, if you can recognize it, otherwise return an empty string.
  `,
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
