import type {
  KnownPdfChatRole,
  PdfChatMessage,
} from '@pas-agent-hub-pdf-chat/pdf-chat-service-types';
import {
  PDF_CHAT_ROLE_ASSISTANT,
  PDF_CHAT_ROLE_USER,
} from '@pas-agent-hub-pdf-chat/pdf-chat-service-types';

/** The transcript used when a conversation has no earlier messages. */
const EMPTY_TRANSCRIPT = '(none)';

/** The label each known role is written with in a transcript. */
const ROLE_LABELS: Record<KnownPdfChatRole, string> = {
  [PDF_CHAT_ROLE_USER]: 'User',
  [PDF_CHAT_ROLE_ASSISTANT]: 'Assistant',
};

/**
 * Formats the earlier messages of a PDF chat conversation as a plain-text
 * transcript for the agent.
 */
export class PdfChatConversation {
  /**
   * Formats the given messages, oldest first, one message per line. Messages
   * whose role is not known are left out.
   * @param history The earlier messages of the conversation.
   * @returns The transcript, or `(none)` when no message is left.
   */
  public format(history: PdfChatMessage[] = []): string {
    const lines = history
      .filter(
        (message): message is PdfChatMessage & { role: KnownPdfChatRole } =>
          this.isKnownRole(message.role),
      )
      .map((message) => `${ROLE_LABELS[message.role]}: ${message.text}`);

    if (lines.length === 0) {
      return EMPTY_TRANSCRIPT;
    }
    return lines.join('\n');
  }

  /**
   * Tells whether a role is one of the known roles.
   * @param role The role of a message.
   * @returns `true` for a known role.
   */
  private isKnownRole(role: string): role is KnownPdfChatRole {
    return Object.prototype.hasOwnProperty.call(ROLE_LABELS, role);
  }
}
