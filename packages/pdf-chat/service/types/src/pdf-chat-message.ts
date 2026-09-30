import { z } from 'zod';

/** Role of a message written by the person asking the questions. */
export const PDF_CHAT_ROLE_USER = 'user';

/** Role of a message written by the agent. */
export const PDF_CHAT_ROLE_ASSISTANT = 'assistant';

/**
 * The roles a PDF chat message is known to have. The set is open: a later
 * version may add roles.
 */
export type KnownPdfChatRole =
  | typeof PDF_CHAT_ROLE_USER
  | typeof PDF_CHAT_ROLE_ASSISTANT;

/**
 * One earlier message of a PDF chat conversation.
 */
export interface PdfChatMessage {
  /**
   * Who wrote the message. A role the reader does not know is ignored.
   */
  role: KnownPdfChatRole | (string & {});
  /**
   * The text of the message.
   */
  text: string;
}

/**
 * Zod schema for `PdfChatMessage`.
 */
export const pdfChatMessageSchema = z.object({
  // The set of roles is open, so any non-empty role passes. A union of the
  // known roles with a non-empty string accepts the same values, but zod then
  // infers the field as optional and the schema no longer satisfies the type.
  role: z
    .string()
    .min(1)
    .meta({
      description: `Who wrote the message. Known roles: ${PDF_CHAT_ROLE_USER}, ${PDF_CHAT_ROLE_ASSISTANT}`,
    }),
  text: z.string().meta({ description: 'The text of the message' }),
}) satisfies z.ZodType<PdfChatMessage>;
