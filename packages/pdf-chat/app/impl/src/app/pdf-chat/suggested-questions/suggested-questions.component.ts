import { Component, inject } from '@angular/core';
import { PdfChatSession } from '../pdf-chat-session';

/** The questions offered while the conversation is empty. */
export const SUGGESTED_QUESTIONS = [
  'Summarize the documents',
  'What are the key points?',
  'What questions do the documents answer?',
];

/**
 * Suggested questions of the PDF chat. Selecting one sends it as the question.
 */
@Component({
  selector: 'app-suggested-questions',
  templateUrl: './suggested-questions.component.html',
  styleUrl: './suggested-questions.component.scss',
})
export class SuggestedQuestionsComponent {
  /** The documents and conversation of the page. */
  protected readonly session = inject(PdfChatSession);
  /** The questions offered. */
  protected readonly questions = SUGGESTED_QUESTIONS;
}
