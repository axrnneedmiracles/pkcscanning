'use server';

/**
 * @fileOverview Summarizes the scan history to identify patterns or frequently scanned plates.
 *
 * - summarizeScanHistory - A function that summarizes the scan history.
 * - SummarizeScanHistoryInput - The input type for the summarizeScanHistory function.
 * - SummarizeScanHistoryOutput - The return type for the summarizeScanHistory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeScanHistoryInputSchema = z.object({
  scanHistory: z
    .string()
    .describe('A list of scanned license plates and timestamps.'),
});

export type SummarizeScanHistoryInput = z.infer<typeof SummarizeScanHistoryInputSchema>;

const SummarizeScanHistoryOutputSchema = z.object({
  summary: z.string().describe('A summary of the scan history.'),
});

export type SummarizeScanHistoryOutput = z.infer<typeof SummarizeScanHistoryOutputSchema>;

export async function summarizeScanHistory(input: SummarizeScanHistoryInput): Promise<SummarizeScanHistoryOutput> {
  return summarizeScanHistoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeScanHistoryPrompt',
  input: {schema: SummarizeScanHistoryInputSchema},
  output: {schema: SummarizeScanHistoryOutputSchema},
  prompt: `You are an expert at summarizing scan histories to identify patterns, frequently scanned plates, or specific vehicles.

  Summarize the following scan history:

  {{scanHistory}}
  `,
});

const summarizeScanHistoryFlow = ai.defineFlow(
  {
    name: 'summarizeScanHistoryFlow',
    inputSchema: SummarizeScanHistoryInputSchema,
    outputSchema: SummarizeScanHistoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
