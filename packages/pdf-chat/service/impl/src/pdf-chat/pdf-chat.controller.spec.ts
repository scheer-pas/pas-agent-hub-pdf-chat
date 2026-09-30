import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { LoggerService } from '@pas/api';
import { Injector, runInInjectionContext } from '@pas/module';
import type { PdfChatRequest } from '@pas-agent-hub-pdf-chat/pdf-chat-service-types';
import type { Response } from 'express';
import { PdfChatController } from './pdf-chat.controller';
import { PdfChatService } from './pdf-chat.service';
import 'reflect-metadata';

/** The parts of a response the controller uses. */
interface ResponseStub {
  headersSent: boolean;
  setHeader: jest.Mock;
  write: jest.Mock;
  end: jest.Mock;
  destroy: jest.Mock;
  on: jest.Mock;
}

describe('PdfChatController', () => {
  const logger = {
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const request: PdfChatRequest = {
    question: 'What is it about?',
    documents: [{ name: 'cats.pdf', data: 'JVBERi0=' }],
  };

  let pdfChat: { ask: jest.Mock };
  let response: ResponseStub;
  /** Simulates the caller closing the connection. */
  let closeConnection: () => void;

  /**
   * Builds the controller with the service stub and the logger resolved from a
   * local injector.
   */
  const createController = (): PdfChatController => {
    const injector = new Injector({
      providers: [
        {
          provide: LoggerService,
          useValue: { withLogger: () => logger, getLogger: () => logger },
        },
        { provide: PdfChatService, useValue: pdfChat },
      ],
    });
    return runInInjectionContext(injector, () => new PdfChatController());
  };

  /**
   * Returns a generator that yields the given parts, then throws the given
   * error if one is passed.
   * @param parts The parts to yield.
   * @param error The error to throw after the parts.
   * @returns The generator.
   */
  async function* partsOf(
    parts: string[],
    error?: Error,
  ): AsyncGenerator<string> {
    for (const part of parts) {
      yield part;
    }
    if (error) {
      throw error;
    }
  }

  beforeEach(() => {
    jest.clearAllMocks();
    pdfChat = { ask: jest.fn() };
    response = {
      headersSent: false,
      setHeader: jest.fn(),
      write: jest.fn(() => {
        response.headersSent = true;
        return true;
      }),
      end: jest.fn(),
      destroy: jest.fn(),
      on: jest.fn((event: string, handler: () => void) => {
        if (event === 'close') {
          closeConnection = handler;
        }
      }),
    };
  });

  it('is registered as a POST route on pdf-chat/ask', () => {
    const handler = PdfChatController.prototype.ask;

    expect(Reflect.getMetadata(PATH_METADATA, PdfChatController)).toBe(
      'pdf-chat',
    );
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe('ask');
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
      RequestMethod.POST,
    );
  });

  it('writes every part of the answer as plain text, then ends the response', async () => {
    pdfChat.ask.mockReturnValue(partsOf(['Cats ', 'purr.']));

    await createController().ask(request, response as unknown as Response);

    expect(pdfChat.ask).toHaveBeenCalledWith(request);
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'text/plain; charset=utf-8',
    );
    expect(response.write.mock.calls).toEqual([['Cats '], ['purr.']]);
    expect(response.end).toHaveBeenCalled();
  });

  it('rethrows a failure that happens before the first part', async () => {
    const failure = new Error('model unavailable');
    pdfChat.ask.mockReturnValue(partsOf([], failure));

    await expect(
      createController().ask(request, response as unknown as Response),
    ).rejects.toBe(failure);
    expect(response.end).not.toHaveBeenCalled();
    expect(response.setHeader).not.toHaveBeenCalled();
  });

  it('stops the answer when the caller closes the connection', async () => {
    let isAnswerEnded = false;
    pdfChat.ask.mockReturnValue(
      (async function* (): AsyncGenerator<string> {
        try {
          yield 'Cats ';
          closeConnection();
          yield 'purr.';
          yield ' Dogs bark.';
        } finally {
          isAnswerEnded = true;
        }
      })(),
    );

    await createController().ask(request, response as unknown as Response);

    expect(response.write.mock.calls).toEqual([['Cats ']]);
    expect(isAnswerEnded).toBe(true);
    expect(response.end).not.toHaveBeenCalled();
  });

  it('aborts the response on a failure after the first part', async () => {
    pdfChat.ask.mockReturnValue(partsOf(['Cats '], new Error('lost')));

    await createController().ask(request, response as unknown as Response);

    expect(response.destroy).toHaveBeenCalled();
    expect(response.end).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });
});
