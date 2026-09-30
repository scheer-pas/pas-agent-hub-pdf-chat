# PDF Chat

PDF Chat lets you upload up to five PDFs and ask questions about them. An AI agent answers from the content of the documents and names the document and page of each source. Each source opens the PDF at that page.

It consists of an app with one page and a service with one endpoint.

## Using the page

1. Add PDFs with **Choose PDFs**, or drag them onto the upload area. You can add several at once, and add more later.
2. Ask a question in the input and press **Send** or Enter. Shift+Enter adds a line break. While the conversation is empty, you can also pick one of the suggested questions:
   - Summarize the documents
   - What are the key points?
   - What questions do the documents answer?
3. The answer appears while it is being produced. When it is complete, its sources are shown below it, for example `contract.pdf, page 3`. Select a source to open that PDF at that page in a new tab. When the documents do not contain the answer, the agent says so.
4. Ask follow-up questions. They are answered with the earlier questions and answers taken into account.

### Limits

| Limit                        | Value |
| ---------------------------- | ----- |
| Active documents at a time   | 5     |
| Size of all active documents | 10 MB |
| File type                    | PDF   |

A file that cannot be added is listed with its name and the reason:

| Reason                                               | When                                                   |
| ---------------------------------------------------- | ------------------------------------------------------ |
| Only PDF files are supported.                        | The file is not a PDF.                                 |
| A document with this name is already added.          | An active document has the same file name.             |
| At most 5 documents can be added.                    | 5 documents are already active.                        |
| The documents together may not be larger than 10 MB. | The file would make the active documents exceed 10 MB. |
| The file could not be read.                          | The browser cannot read the file.                      |

The other files of the same selection are still added. While the files of a selection are being read, no other document can be added or removed and no question can be sent.

### Documents and conversation

| Action     | Result                                                                         |
| ---------- | ------------------------------------------------------------------------------ |
| Remove     | Removes one document. The conversation stays, unless it was the last document. |
| Clear chat | Clears the conversation. The documents stay.                                   |

Documents cannot be added or removed while an answer is being produced. A source whose document has been removed is shown as plain text instead of a link.

Nothing is stored: reloading the page discards the documents and the conversation.

When an answer cannot be produced, the page shows the message "The answer could not be produced. Please try again." and marks the question as **Not answered**.

## On a PAS platform

The Control Hub shows two components: the service `pdf-chat-service` and the app `pdf-chat-app`. The service declares one agent, `pdf-chat`.

## Configuration

The agent is configured in the service configuration under `agents.pdfChat`:

```json
{
  "agents": {
    "pdfChat": {
      "version": "26",
      "model": {
        "provider": "universal",
        "model": "openai:gpt-4o-mini",
        "apiKey": "<your OpenAI API key>"
      },
      "mcpServers": {}
    }
  }
}
```

| Key                           | Meaning                                                                   |
| ----------------------------- | ------------------------------------------------------------------------- |
| `agents.pdfChat.model.model`  | The model that reads the PDFs and answers. It must accept PDF file input. |
| `agents.pdfChat.model.apiKey` | The API key of the model provider.                                        |

The service accepts request bodies of up to 15 MB.

## Service endpoint

### `POST /pdf-chat/ask`

Answers a question about a set of PDF documents.

Request body:

| Field              | Type                  | Required | Meaning                                                 |
| ------------------ | --------------------- | -------- | ------------------------------------------------------- |
| `question`         | string, not empty     | yes      | The question to answer.                                 |
| `documents`        | list of 1 to 5        | yes      | The documents the question is about.                    |
| `documents[].name` | string, not empty     | yes      | The file name of the document.                          |
| `documents[].data` | string                | yes      | The content of the PDF file, base64-encoded.            |
| `history`          | list of messages      | no       | The earlier messages of the conversation, oldest first. |
| `history[].role`   | `user` or `assistant` | yes      | Who wrote the message.                                  |
| `history[].text`   | string                | yes      | The text of the message.                                |

Example:

```json
{
  "question": "What is the notice period?",
  "documents": [
    { "name": "contract.pdf", "data": "JVBERi0xLjQK..." },
    { "name": "annex-b.pdf", "data": "JVBERi0xLjcK..." }
  ],
  "history": [
    { "role": "user", "text": "Who are the parties?" },
    {
      "role": "assistant",
      "text": "Acme GmbH and Beta AG.\nSources: contract.pdf, page 1"
    }
  ]
}
```

Response: the answer as `text/plain`, sent in parts while it is produced. An answer that uses the documents ends with a sources line:

```text
The notice period is three months to the end of a quarter.
Sources: contract.pdf, page 4; annex-b.pdf, page 1
```

A page number counts the pages of the PDF file, starting with 1 for its first page. It does not follow page numbers printed on the pages.

| Status | Meaning                                                                                  |
| ------ | ---------------------------------------------------------------------------------------- |
| 200    | The answer follows. If the answer breaks off after it started, the connection is closed. |
| 400    | The request body does not match the table above.                                         |
| 413    | The request body is larger than 15 MB.                                                   |
| 500    | The answer could not be produced, for example because the model is not reachable.        |

The service ignores fields it does not know and history messages with a role it does not know. When the caller closes the connection before the answer is complete, the service stops producing it.

The endpoint has no sign-in and accepts requests from any origin. Each request uses the API key of the agent and costs tokens, so protect the service before you make it reachable for others.

For calling the endpoint from an app, see the [service client](service/client/README.md). The request and answer types are described in the [service types](service/types/README.md).
