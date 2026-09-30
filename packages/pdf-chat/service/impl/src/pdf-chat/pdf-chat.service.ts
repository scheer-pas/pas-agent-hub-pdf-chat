import { MultimodalInput, ProgressReportMessage } from '@pas/agent-api';
import { inject } from '@pas/module';
import type { PdfChatRequest } from '@pas-agent-hub-pdf-chat/pdf-chat-service-types';
import { BaseMessage } from 'langchain';
import { PdfChatAgent, PdfChatPrompt } from './pdf-chat.agent';
import { PdfChatConversation } from './pdf-chat-conversation';

/** The MIME type the document is attached with. */
const PDF_MIME_TYPE = 'application/pdf';

/** The message type of a part of the agent's answer. */
const ANSWER_MESSAGE_TYPE = 'ai';

/**
 * Answers questions about PDF documents with the PDF chat agent.
 */
export class PdfChatService {
  private readonly agent = inject(PdfChatAgent);
  private readonly conversation = inject(PdfChatConversation);
  private readonly progressReports = new ProgressReportMessage();

  /**
   * Asks the agent the question of the request and yields the answer in parts,
   * as the agent produces them.
   * @param request The question, the documents, and the earlier messages.
   * @returns The parts of the answer, in order.
   */
  public async *ask(request: PdfChatRequest): AsyncGenerator<string> {
    const stream = await this.agent.stream(this.toAgentInput(request));

    for await (const message of stream) {
      const text = this.answerText(message);
      if (text) {
        yield text;
      }
    }
  }

  /**
   * Builds the agent input: the question, the document names, and the
   * transcript as text, each PDF as a file attachment.
   * @param request The request to build the input for.
   * @returns The multimodal agent input.
   */
  private toAgentInput(
    request: PdfChatRequest,
  ): MultimodalInput<PdfChatPrompt> {
    return {
      input: {
        question: request.question,
        documents: request.documents
          .map((document, index) => `${index + 1}. ${document.name}`)
          .join('\n'),
        history: this.conversation.format(request.history),
      },
      attachments: request.documents.map((document) => ({
        type: 'file' as const,
        data: document.data,
        mimeType: PDF_MIME_TYPE,
        metadata: { filename: document.name },
      })),
    };
  }

  /**
   * Returns the text a streamed message adds to the answer.
   * @param message A message of the agent's stream.
   * @returns The text of an answer part, or an empty string for any other message.
   */
  private answerText(message: BaseMessage): string {
    if (this.progressReports.read(message)) {
      return '';
    }
    if (message.type !== ANSWER_MESSAGE_TYPE) {
      return '';
    }
    return message.text;
  }
}
