import { z } from 'zod';

/**
 * The PDF document a question is about.
 */
export interface PdfChatDocument {
  /**
   * The file name of the document.
   */
  name: string;
  /**
   * The content of the PDF file, base64-encoded.
   */
  data: string;
}

/**
 * Zod schema for `PdfChatDocument`.
 */
export const pdfChatDocumentSchema = z.object({
  name: z
    .string()
    .min(1)
    .meta({ description: 'The file name of the document' }),
  data: z
    .string()
    .meta({ description: 'The content of the PDF file, base64-encoded' }),
}) satisfies z.ZodType<PdfChatDocument>;
