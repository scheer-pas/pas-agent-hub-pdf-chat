import { Component, inject } from '@angular/core';
import { ChatConversationComponent } from './chat-conversation/chat-conversation.component';
import { PdfChatSession } from './pdf-chat-session';
import { PdfUploadComponent } from './pdf-upload/pdf-upload.component';
import { QuestionInputComponent } from './question-input/question-input.component';
import { SuggestedQuestionsComponent } from './suggested-questions/suggested-questions.component';

/**
 * PDF Chat: lets the person upload PDFs and ask questions about them. Owns the
 * session of the page and composes the upload area, the conversation, the
 * suggested questions, and the question input.
 */
@Component({
  selector: 'app-pdf-chat',
  imports: [
    PdfUploadComponent,
    ChatConversationComponent,
    SuggestedQuestionsComponent,
    QuestionInputComponent,
  ],
  providers: [PdfChatSession],
  templateUrl: './pdf-chat.component.html',
  styleUrl: './pdf-chat.component.scss',
})
export class PdfChatComponent {
  /** The documents and the conversation of this page. */
  protected readonly session = inject(PdfChatSession);
}
