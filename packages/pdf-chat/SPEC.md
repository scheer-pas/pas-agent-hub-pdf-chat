# PDF Chat

## Background

PDF Chat lets a person upload up to five PDF documents and ask questions about them in a chat. An AI agent answers from the content of the documents and names the pages it used. Each named page is a link that opens the document at that page.

The feature consists of a service and an app. The service exposes one operation that answers a question about a set of documents. The app is one page: it shows the upload area and the chat.

The service keeps no state between requests. Each request carries the documents, the question, and the earlier messages of the conversation. The app holds the documents and the conversation for as long as the page stays open.

## Acceptance Criteria

### Document upload

- The person selects one or more PDF files with a file picker or by dragging them onto the upload area. Each selected file is added to the active documents.
- At most 5 documents are active at a time. The active documents together are at most 10 MB.
- Each selected file is checked in the order it was selected, against the active documents including the files accepted before it. A file that fails a check is rejected and the others are still added. Each rejected file is listed with its file name and the reason:
  - a file that is not of type PDF: "Only PDF files are supported."
  - a file with the same name as an active document: "A document with this name is already added."
  - a file that would make more than 5 active documents: "At most 5 documents can be added."
  - a file that would make the active documents larger than 10 MB together: "The documents together may not be larger than 10 MB."
  - a file that the browser cannot read: "The file could not be read."
- While the selected files are being read, no other document can be added or removed and no question can be sent. The files of one selection are added together, after all of them are read.
- The rejection list is replaced by the result of the next selection, and cleared when a document is removed.
- The page lists the active documents with the name and the size of each, and the total size.
- The person can remove each active document. Removing a document keeps the conversation. Removing the last document clears the conversation.
- The documents cannot be added or removed while an answer is being produced.
- The question input is disabled while no document is active.

### Asking questions

- The person types a question and sends it with the send button or the Enter key. Shift+Enter starts a new line in the question.
- An empty question, or one made only of spaces, cannot be sent.
- The page offers three suggested questions while at least one document is active and the conversation is empty: "Summarize the documents", "What are the key points?", and "What questions do the documents answer?". Selecting one sends it as the question.
- While an answer is being produced, the person cannot send another question.

### Answers

- The agent answers only from the content of the active documents.
- When the documents do not contain the answer, the agent says so and does not invent one.
- Each answer that uses the documents ends with one line naming the document and the page of each source, in the form `Sources: contract.pdf, page 3; notes.pdf, page 7`.
- A page number counts the pages of the PDF file, starting with 1 for its first page, independently of any page numbers printed on the pages.
- The answer appears on the page while it is being produced, part by part, and not only once it is complete. Until its first part arrives, the conversation shows "Reading the documents…" in place of the answer.
- A follow-up question is answered with the earlier questions and answers of the conversation taken into account.

### Sources

- Once an answer is complete, each source of its sources line whose document is active is shown as a link, labelled with the document name and the page.
- A source that names a range of pages, for example `contract.pdf, pages 3–5`, names every page of the range: pages 3, 4 and 5.
- A source that names only a page refers to the document of the source before it. For example, `Sources: contract.pdf, page 1; page 2` names page 1 and page 2 of `contract.pdf`. A source that names only a page and has no source before it names no document.
- Opening a source link opens the document in a new browser tab at the named page.
- A source whose document is not active is shown as plain text, not as a link.

### Conversation

- The conversation shows every question and answer in the order they were sent, the question aligned to one side and the answer to the other.
- The person can clear the conversation, except while an answer is being produced. The active documents stay.
- Reloading the page discards the documents and the conversation.

### Errors

- When an answer cannot be produced, the page shows a toast with the message "The answer could not be produced. Please try again." The question stays in the conversation, marked "Not answered".

### Service contract

The service offers the operation `POST /pdf-chat/ask`.

Request body:

| Field              | Type                         | Required | Meaning                                                 |
| ------------------ | ---------------------------- | -------- | ------------------------------------------------------- |
| `question`         | string, at least 1 character | yes      | The question to answer.                                 |
| `documents`        | list of 1 to 5 documents     | yes      | The documents the question is about.                    |
| `documents[].name` | string, at least 1 character | yes      | The file name of the document.                          |
| `documents[].data` | string                       | yes      | The content of the PDF file, base64-encoded.            |
| `history`          | list of messages             | no       | The earlier messages of the conversation, oldest first. |
| `history[].role`   | `user` or `assistant`        | yes      | Who wrote the message.                                  |
| `history[].text`   | string                       | yes      | The text of the message.                                |

- The response is the answer as plain text, sent in parts while it is produced.
- A request whose body does not match the table is rejected with status 400.
- A request body of up to 15 MB is accepted. A larger request body is rejected with status 413.
- When the caller closes the connection before the answer is complete, the service stops producing the answer.
- The request body is extensible: a later version may add optional fields, and the service ignores fields it does not know. The set of roles is extensible: the service ignores a history message whose role it does not know.

### Page

- The page shows the header, the hero, the sidebar, and the PDF Chat. It shows no other cards.

### Names on the platform

- The service is the component `pdf-chat-service`, and the app is the component `pdf-chat-app`.
- The service declares one agent: `pdf-chat`, configured under `agents.pdfChat`.
- `POST /pdf-chat/ask` is the only operation of the service, besides the health check and the API documentation that every PAS service has.

## Out of Scope

- Storing documents or conversations on the service or across page reloads.
- More than 5 active documents, or more than 10 MB of active documents together.
- Splitting documents into chunks, embeddings, or a vector store.
- Reading text from scanned images beyond what the model reads from the PDFs themselves.
- Sign-in and per-user documents.
- Highlighting the cited passage on the opened page.
