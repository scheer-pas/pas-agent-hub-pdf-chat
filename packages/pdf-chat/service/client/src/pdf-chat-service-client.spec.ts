import { Axios, AxiosProgressEvent, AxiosRequestConfig } from 'axios';
import type { PdfChatRequest } from '@pas-agent-hub-pdf-chat/pdf-chat-service-types';
import { PdfChatServiceClient } from './pdf-chat-service-client';

describe('PdfChatServiceClient', () => {
  const request: PdfChatRequest = {
    question: 'What is it about?',
    documents: [{ name: 'cats.pdf', data: 'JVBERi0=' }],
  };

  let post: jest.Mock;
  let client: PdfChatServiceClient;

  /**
   * Returns the request configuration the client passed to the last post.
   * @returns The configuration.
   */
  const lastConfig = (): AxiosRequestConfig => post.mock.calls[0][2];

  /**
   * Builds a progress event whose request holds the given response text.
   * @param responseText The text received so far.
   * @returns The event.
   */
  const progressEvent = (responseText: unknown): AxiosProgressEvent =>
    ({
      event: { target: { responseText } },
    }) as unknown as AxiosProgressEvent;

  beforeEach(() => {
    post = jest.fn().mockResolvedValue({ data: 'Cats purr.' });
    client = new PdfChatServiceClient({ post } as unknown as Axios);
  });

  it('posts the request to pdf-chat/ask as text and returns the answer', async () => {
    await expect(client.askPdfChat(request)).resolves.toBe('Cats purr.');

    expect(post).toHaveBeenCalledWith(
      'pdf-chat/ask',
      request,
      expect.objectContaining({ responseType: 'text' }),
    );
  });

  it('reports the answer received so far', async () => {
    const onProgress = jest.fn();
    await client.askPdfChat(request, onProgress);

    lastConfig().onDownloadProgress?.(progressEvent('Cats '));

    expect(onProgress).toHaveBeenCalledWith('Cats ');
  });

  it('reports nothing when the event carries no response text', async () => {
    const onProgress = jest.fn();
    await client.askPdfChat(request, onProgress);

    lastConfig().onDownloadProgress?.(progressEvent(undefined));
    lastConfig().onDownloadProgress?.({} as AxiosProgressEvent);

    expect(onProgress).not.toHaveBeenCalled();
  });

  it('ignores progress when no callback is given', async () => {
    await client.askPdfChat(request);

    expect(() =>
      lastConfig().onDownloadProgress?.(progressEvent('Cats ')),
    ).not.toThrow();
  });
});
