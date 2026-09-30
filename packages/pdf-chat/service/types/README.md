# pdf-chat-service-types

This library was generated with [Nx](https://nx.dev).

It holds the types of the `pdf-chat` service. Each type comes with a schema that validates it.

## PDF chat types

| Type              | Schema                  | Describes                                                                    |
| ----------------- | ----------------------- | ---------------------------------------------------------------------------- |
| `PdfChatRequest`  | `pdfChatRequestSchema`  | A question about documents: `question`, `documents` (1 to 5), and `history`. |
| `PdfChatDocument` | `pdfChatDocumentSchema` | A PDF document: its file `name` and its base64-encoded `data`.               |
| `PdfChatMessage`  | `pdfChatMessageSchema`  | One earlier message of a conversation: its `role` and its `text`.            |
| `PdfChatAnswer`   | `pdfChatAnswerSchema`   | The answer as plain text.                                                    |

`MAX_PDF_CHAT_DOCUMENTS` is the largest number of documents a request carries (5).

The known roles of a message are `PDF_CHAT_ROLE_USER` (`user`) and `PDF_CHAT_ROLE_ASSISTANT` (`assistant`), listed together in the type `KnownPdfChatRole`. The set is open: a later version may add roles, and a message with a role the reader does not know is ignored.

```typescript
import { PDF_CHAT_ROLE_USER } from '@pas-agent-hub-pdf-chat/pdf-chat-service-types';
import type { PdfChatRequest } from '@pas-agent-hub-pdf-chat/pdf-chat-service-types';

const request: PdfChatRequest = {
  question: 'And the renewal terms?',
  documents: [{ name: 'contract.pdf', data: base64Content }],
  history: [{ role: PDF_CHAT_ROLE_USER, text: 'What is the notice period?' }],
};
```

## Running unit tests

Run `nx test pdf-chat-service-types` to execute the unit tests via [Jest](https://jestjs.io).
