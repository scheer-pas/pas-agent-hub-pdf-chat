import { z } from 'zod';

/**
 * The answer to a question about PDF documents, as plain text.
 */
export type PdfChatAnswer = string;

/**
 * Zod schema for `PdfChatAnswer`.
 */
export const pdfChatAnswerSchema = z.string().meta({
  description:
    'The answer as plain text, sent in parts while it is produced. It ends with the pages it is based on.',
}) satisfies z.ZodType<PdfChatAnswer>;
