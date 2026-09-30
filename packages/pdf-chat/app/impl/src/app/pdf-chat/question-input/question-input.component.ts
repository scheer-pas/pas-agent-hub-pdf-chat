import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PdfChatSession } from '../pdf-chat-session';

/**
 * Question input of the PDF chat. Sends the question with the send button or
 * the Enter key; Shift+Enter adds a line break.
 */
@Component({
  selector: 'app-question-input',
  imports: [FormsModule],
  templateUrl: './question-input.component.html',
  styleUrl: './question-input.component.scss',
})
export class QuestionInputComponent {
  /** The documents and conversation of the page. */
  protected readonly session = inject(PdfChatSession);
  /** The question being typed. */
  public readonly question = signal('');
  /** Whether the typed question can be sent now. */
  public readonly canSend = computed(
    () => this.session.canAsk() && this.question().trim().length > 0,
  );
  /** The hint shown in the empty input. */
  public readonly placeholder = computed(() =>
    this.session.documents().length > 0
      ? 'Ask a question about the documents…'
      : 'Upload a PDF to start asking questions',
  );

  /**
   * Sends the question on Enter without Shift and keeps the line break of
   * Shift+Enter.
   * @param event The keydown event of the input.
   */
  public async onKeydown(event: KeyboardEvent): Promise<void> {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }
    event.preventDefault();
    await this.send();
  }

  /** Sends the typed question and empties the input. */
  public async send(): Promise<void> {
    if (!this.canSend()) {
      return;
    }
    const question = this.question();
    this.question.set('');
    await this.session.ask(question);
  }
}
