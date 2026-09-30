import { Agent, DefaultAgent, MultimodalInput } from '@pas/agent-api';

/**
 * The text part of a PDF chat prompt. The PDFs themselves travel as
 * attachments.
 */
export interface PdfChatPrompt extends Record<string, unknown> {
  /** The question to answer. */
  question: string;
  /** The file names of the attached documents, one per line, in attachment order. */
  documents: string;
  /** The earlier messages of the conversation, formatted as a transcript. */
  history: string;
}

/**
 * Answers a question about the attached PDF documents, using only their
 * content and naming the document and page of each source.
 */
@Agent({
  configKey: 'agents.pdfChat',
  agentName: 'pdf-chat',
  systemPrompt: [
    'You answer questions about the attached PDF documents.',
    'Use only the content of the documents. Do not use outside knowledge.',
    'When the documents do not contain the answer, say "The documents do not contain this information." and do not invent an answer.',
    'Take the earlier messages of the conversation into account for follow-up questions.',
    'End every answer that uses the documents with one line that names the document and the page of each source, in exactly this form: "Sources: contract.pdf, page 3; notes.pdf, page 7".',
    'Use the file names exactly as they are listed. Count pages within each PDF file, starting with 1 for its first page, and ignore page numbers printed on the pages.',
  ].join('\n'),
  userPrompt: [
    'Attached documents, in this order:',
    '{{input.documents}}',
    '',
    'Earlier messages of the conversation:',
    '{{input.history}}',
    '',
    'Question: {{input.question}}',
  ].join('\n'),
})
export class PdfChatAgent extends DefaultAgent<
  MultimodalInput<PdfChatPrompt>
> {}
