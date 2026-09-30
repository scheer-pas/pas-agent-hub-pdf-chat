# pdf-chat-service-client

This library was generated with [Nx](https://nx.dev).

It is the client of the `pdf-chat` service. Its default export is `PdfChatServiceClient`, which is created with a configured `Axios` instance.

## Asking a question about PDFs

`askPdfChat(request, onProgress?)` calls `POST /pdf-chat/ask` and resolves with the complete answer. `onProgress` is called with the answer received so far each time a part of it arrives. It is called in the browser only, where the transport reports partial responses.

```typescript
const answer = await client.askPdfChat(
  {
    question: 'What is the notice period?',
    documents: [{ name: 'contract.pdf', data: base64Content }],
    history: [],
  },
  (answerSoFar) => showAnswer(answerSoFar),
);
// "The notice period is three months to the end of a quarter.\nSources: contract.pdf, page 4"
```

The request and answer types come from `@pas-agent-hub-pdf-chat/pdf-chat-service-types`. The endpoint is described in the [pdf-chat README](../../README.md).

## Running unit tests

Run `nx test pdf-chat-service-client` to execute the unit tests via [Jest](https://jestjs.io).
