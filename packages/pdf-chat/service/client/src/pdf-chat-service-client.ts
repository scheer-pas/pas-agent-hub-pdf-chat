import { Axios, AxiosProgressEvent } from 'axios';
import type {
  PdfChatAnswer,
  PdfChatRequest,
} from '@pas-agent-hub-pdf-chat/pdf-chat-service-types';

/**
 * Receives the answer produced so far while a PDF chat answer is streamed.
 */
export type PdfChatAnswerProgress = (answerSoFar: PdfChatAnswer) => void;

/**
 * Calls the PDF chat service. The address of the service comes from the
 * configuration of the app.
 */
export class PdfChatServiceClient {
  /**
   * @param axios The HTTP client, configured with the address of the service.
   */
  public constructor(private readonly axios: Axios) {}

  /**
   * Asks a question about PDF documents.
   * @param input The question, the documents, and the earlier messages.
   * @param onProgress Called with the answer produced so far each time a part
   *   of it arrives. Only called where the transport reports partial responses,
   *   as it does in the browser.
   * @returns The complete answer.
   */
  public async askPdfChat(
    input: PdfChatRequest,
    onProgress?: PdfChatAnswerProgress,
  ): Promise<PdfChatAnswer> {
    const response = await this.axios.post<PdfChatAnswer>(
      'pdf-chat/ask',
      input,
      {
        responseType: 'text',
        onDownloadProgress: (event) => this.reportProgress(event, onProgress),
      },
    );
    return response.data;
  }

  /**
   * Passes the answer received so far to the progress callback.
   * @param event The download progress event of the request.
   * @param onProgress The callback to pass the answer to.
   */
  private reportProgress(
    event: AxiosProgressEvent,
    onProgress?: PdfChatAnswerProgress,
  ): void {
    // In the browser the event carries the request, whose response text holds
    // everything received so far.
    const request = event.event?.target as XMLHttpRequest | undefined;
    if (!onProgress || typeof request?.responseText !== 'string') {
      return;
    }
    onProgress(request.responseText);
  }
}
