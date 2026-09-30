import { z } from 'zod';
import type { PdfChatDocument } from './pdf-chat-document.js';
import { pdfChatDocumentSchema } from './pdf-chat-document.js';
import type { PdfChatMessage } from './pdf-chat-message.js';
import { pdfChatMessageSchema } from './pdf-chat-message.js';

/** Largest number of documents one question can be about. */
export const MAX_PDF_CHAT_DOCUMENTS = 5;

/**
 * Request payload for asking a question about a set of PDF documents.
 */
export interface PdfChatRequest {
  /**
   * The question to answer.
   */
  question: string;
  /**
   * The documents the question is about, 1 to 5.
   */
  documents: PdfChatDocument[];
  /**
   * The earlier messages of the conversation, oldest first.
   */
  history?: PdfChatMessage[];
}

/**
 * Zod schema for `PdfChatRequest`.
 */
export const pdfChatRequestSchema = z.object({
  question: z.string().min(1).meta({ description: 'The question to answer' }),
  documents: z
    .array(pdfChatDocumentSchema)
    .min(1)
    .max(MAX_PDF_CHAT_DOCUMENTS)
    .meta({ description: 'The documents the question is about, 1 to 5' }),
  history: z.array(pdfChatMessageSchema).optional().meta({
    description: 'The earlier messages of the conversation, oldest first',
  }),
}) satisfies z.ZodType<PdfChatRequest>;
