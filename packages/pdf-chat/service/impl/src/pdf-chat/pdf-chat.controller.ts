import { Body, Post, Res } from '@nestjs/common';
import { injectLogger } from '@pas/api';
import { inject } from '@pas/module';
import { ApiBody, ApiResponse, PasController } from '@pas/service-nestjs-api';
import { ParseValidatorPipe } from '@pas/service-nestjs-common';
import type { PdfChatRequest } from '@pas-agent-hub-pdf-chat/pdf-chat-service-types';
import {
  pdfChatAnswerSchema,
  pdfChatRequestSchema,
} from '@pas-agent-hub-pdf-chat/pdf-chat-service-types';
import type { Response } from 'express';
import { PdfChatService } from './pdf-chat.service';

/** The content type the answer is sent with. */
const ANSWER_CONTENT_TYPE = 'text/plain; charset=utf-8';

/**
 * Serves questions about PDF documents under `/pdf-chat`.
 */
@PasController({ path: 'pdf-chat' })
export class PdfChatController {
  private readonly logger = injectLogger('pdfchat.controller');
  private readonly pdfChat = inject(PdfChatService);

  /**
   * Answers a question about PDF documents. The answer is written to the
   * response as plain text, part by part, while the agent produces it.
   *
   * A failure before the first part is reported as an error response. A
   * failure after the first part aborts the response. When the caller closes
   * the connection, the answer is no longer produced.
   * @param body The question, the documents, and the earlier messages.
   * @param response The response the answer is written to.
   */
  @Post('ask')
  @ApiBody({ schema: pdfChatRequestSchema })
  @ApiResponse({ status: 200, schema: pdfChatAnswerSchema })
  public async ask(
    @Body(new ParseValidatorPipe(pdfChatRequestSchema)) body: PdfChatRequest,
    @Res() response: Response,
  ): Promise<void> {
    let isClosed = false;
    response.on('close', () => {
      isClosed = true;
    });

    try {
      for await (const part of this.pdfChat.ask(body)) {
        // Leaving the loop ends the answer, which stops the agent.
        if (isClosed) {
          return;
        }
        this.writePart(response, part);
      }
    } catch (error) {
      // Before the first part the status can still be set, so the error
      // response is left to the framework.
      if (!response.headersSent) {
        throw error;
      }
      this.logger.error('The answer broke off after it started', error);
      response.destroy();
      return;
    }

    if (!response.headersSent) {
      response.setHeader('Content-Type', ANSWER_CONTENT_TYPE);
    }
    response.end();
  }

  /**
   * Writes one part of the answer. The content type is set with the first
   * part, so a failure before it is answered as an error.
   * @param response The response the answer is written to.
   * @param part The part to write.
   */
  private writePart(response: Response, part: string): void {
    if (!response.headersSent) {
      response.setHeader('Content-Type', ANSWER_CONTENT_TYPE);
    }
    response.write(part);
  }
}
