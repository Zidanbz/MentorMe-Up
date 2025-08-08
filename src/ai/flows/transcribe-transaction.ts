'use server';

/**
 * @fileOverview A flow for transcribing transaction details from voice input in Indonesian.
 *
 * - transcribeTransaction - A function that handles the transcription of transaction details.
 * - TranscribeTransactionInput - The input type for the transcribeTransaction function.
 * - TranscribeTransactionOutput - The return type for the transcribeTransaction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranscribeTransactionInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "Audio data URI of the voice input in Indonesian.  It must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeTransactionInput = z.infer<typeof TranscribeTransactionInputSchema>;

const TranscribeTransactionOutputSchema = z.object({
  transactionDetails: z
    .string()
    .describe('The transcribed transaction details from the voice input.'),
});
export type TranscribeTransactionOutput = z.infer<typeof TranscribeTransactionOutputSchema>;

export async function transcribeTransaction(input: TranscribeTransactionInput): Promise<TranscribeTransactionOutput> {
  return transcribeTransactionFlow(input);
}

const transcribeTransactionPrompt = ai.definePrompt({
  name: 'transcribeTransactionPrompt',
  input: {schema: TranscribeTransactionInputSchema},
  output: {schema: TranscribeTransactionOutputSchema},
  prompt: `You are an AI assistant specializing in transcribing Indonesian voice input into transaction details.

  Transcribe the following audio data into a clear and concise description of the transaction.

  Audio: {{media url=audioDataUri}}
  `,
});

const transcribeTransactionFlow = ai.defineFlow(
  {
    name: 'transcribeTransactionFlow',
    inputSchema: TranscribeTransactionInputSchema,
    outputSchema: TranscribeTransactionOutputSchema,
  },
  async input => {
    const {output} = await transcribeTransactionPrompt(input);
    return output!;
  }
);
