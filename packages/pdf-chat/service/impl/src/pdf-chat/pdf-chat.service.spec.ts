import { Injector, runInInjectionContext } from '@pas/module';
import { AIMessageChunk, BaseMessage, ToolMessage } from 'langchain';
import { PdfChatAgent } from './pdf-chat.agent';
import { PdfChatConversation } from './pdf-chat-conversation';
import { PdfChatService } from './pdf-chat.service';

describe('PdfChatService', () => {
  let agent: { stream: jest.Mock };

  /**
   * Builds the service with the agent stub and the real conversation formatter
   * resolved from a local injector.
   */
  const createService = (): PdfChatService => {
    const injector = new Injector({
      providers: [
        { provide: PdfChatAgent, useValue: agent },
        { provide: PdfChatConversation, useValue: new PdfChatConversation() },
      ],
    });
    return runInInjectionContext(injector, () => new PdfChatService());
  };

  /**
   * Returns an async generator that yields the given messages.
   * @param messages The messages to yield.
   * @returns The generator.
   */
  async function* streamOf(
    messages: BaseMessage[],
  ): AsyncGenerator<BaseMessage> {
    for (const message of messages) {
      yield message;
    }
  }

  /**
   * Collects every part the service yields for a request.
   * @param service The service to ask.
   * @returns The parts, in order.
   */
  const collect = async (service: PdfChatService): Promise<string[]> => {
    const parts: string[] = [];
    for await (const part of service.ask({
      question: 'What is it about?',
      documents: [
        { name: 'cats.pdf', data: 'JVBERi0=' },
        { name: 'dogs.pdf', data: 'JVBERi1=' },
      ],
      history: [{ role: 'user', text: 'Hi' }],
    })) {
      parts.push(part);
    }
    return parts;
  };

  beforeEach(() => {
    agent = { stream: jest.fn() };
  });

  it('sends the question, the document names, the transcript and each PDF as a file attachment', async () => {
    agent.stream.mockResolvedValue(streamOf([]));

    await collect(createService());

    expect(agent.stream).toHaveBeenCalledWith({
      input: {
        question: 'What is it about?',
        documents: '1. cats.pdf\n2. dogs.pdf',
        history: 'User: Hi',
      },
      attachments: [
        {
          type: 'file',
          data: 'JVBERi0=',
          mimeType: 'application/pdf',
          metadata: { filename: 'cats.pdf' },
        },
        {
          type: 'file',
          data: 'JVBERi1=',
          mimeType: 'application/pdf',
          metadata: { filename: 'dogs.pdf' },
        },
      ],
    });
  });

  it('yields the text of the answer parts in order', async () => {
    agent.stream.mockResolvedValue(
      streamOf([
        new AIMessageChunk({ content: 'Cats ' }),
        new AIMessageChunk({ content: 'purr.' }),
      ]),
    );

    expect(await collect(createService())).toEqual(['Cats ', 'purr.']);
  });

  it('skips messages that are not answer parts and empty parts', async () => {
    agent.stream.mockResolvedValue(
      streamOf([
        new ToolMessage({ content: 'tool output', tool_call_id: '1' }),
        new AIMessageChunk({ content: '' }),
        new AIMessageChunk({ content: 'Answer' }),
      ]),
    );

    expect(await collect(createService())).toEqual(['Answer']);
  });
});
