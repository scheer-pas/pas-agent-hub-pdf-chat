import { Component, inject } from '@angular/core';
import { PDF_CHAT_ROLE_USER } from '@pas-agent-hub-pdf-chat/pdf-chat-service-types';
import { PdfChatEntryStatus, PdfChatSession } from '../pdf-chat-session';

/**
 * Conversation of the PDF chat: every question and answer in the order they
 * were sent, questions on the right and answers on the left.
 */
@Component({
  selector: 'app-chat-conversation',
  templateUrl: './chat-conversation.component.html',
  styleUrl: './chat-conversation.component.scss',
})
export class ChatConversationComponent {
  /** The documents and conversation of the page. */
  protected readonly session = inject(PdfChatSession);
  /** Role of a question. */
  protected readonly userRole = PDF_CHAT_ROLE_USER;
  /** The states an entry can have. */
  protected readonly status = PdfChatEntryStatus;
}
