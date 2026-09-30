import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import ServiceClient from '@pas-agent-hub-pdf-chat/pdf-chat-service-client';
import type {
  KnownPdfChatRole,
  PdfChatMessage,
} from '@pas-agent-hub-pdf-chat/pdf-chat-service-types';
import {
  MAX_PDF_CHAT_DOCUMENTS,
  PDF_CHAT_ROLE_ASSISTANT,
  PDF_CHAT_ROLE_USER,
} from '@pas-agent-hub-pdf-chat/pdf-chat-service-types';
import { ToastService } from '../toast/toast.service';
import { AnswerSource, AnswerSourcesParser } from './answer-sources';

/** Largest size of the active documents together, in bytes (10 MB). */
export const MAX_TOTAL_PDF_SIZE_BYTES = 10 * 1024 * 1024;

/** MIME type of a PDF file. */
const PDF_MIME_TYPE = 'application/pdf';

/** File extension of a PDF file, used when the browser reports no MIME type. */
const PDF_EXTENSION = '.pdf';

/** Why a selected file is not added, as the page shows it. */
export enum PdfFileRejection {
  /** The file is not a PDF. */
  NotAPdf = 'Only PDF files are supported.',
  /** The name of the file is already used by an active document. */
  DuplicateName = 'A document with this name is already added.',
  /** The file would exceed the number of active documents. */
  TooManyDocuments = 'At most 5 documents can be added.',
  /** The file would exceed the total size of the active documents. */
  DocumentsTooLarge = 'The documents together may not be larger than 10 MB.',
  /** The browser cannot read the file. */
  Unreadable = 'The file could not be read.',
}

/** Message shown when an answer cannot be produced. */
export const ANSWER_FAILED_MESSAGE =
  'The answer could not be produced. Please try again.';

/** State of one entry of the conversation. */
export enum PdfChatEntryStatus {
  /** The entry is complete. */
  Done = 'done',
  /** The answer is being produced. */
  Answering = 'answering',
  /** No answer could be produced for the question. */
  Failed = 'failed',
}

/** One question or answer of the conversation. */
export interface PdfChatEntry {
  /** Identifies the entry within the conversation. */
  id: number;
  /** Who wrote the entry. */
  role: KnownPdfChatRole;
  /** The full text of the entry, as sent in the history. */
  text: string;
  /** The text shown for the entry: the text without the sources line of a complete answer. */
  body: string;
  /** The sources a complete answer names. Empty for questions and unfinished answers. */
  sources: AnswerSource[];
  /** The state of the entry. */
  status: PdfChatEntryStatus;
}

/** One document the questions are about. */
export interface ActivePdfDocument {
  /** The file name, unique among the active documents. */
  name: string;
  /** The file size in bytes. */
  size: number;
  /** The file content, base64-encoded. */
  data: string;
  /** A browser address that opens the file. */
  url: string;
}

/** A selected file that was not added, with the reason. */
export interface RejectedPdfFile {
  /** The name of the file. */
  fileName: string;
  /** Why the file was not added. */
  reason: PdfFileRejection;
}

/**
 * Holds the active documents and the conversation about them for as long as
 * the page stays open, and asks the service the questions.
 */
@Injectable()
export class PdfChatSession {
  private readonly serviceClient = inject(ServiceClient);
  private readonly toast = inject(ToastService);
  private readonly sourcesParser = new AnswerSourcesParser();
  private nextEntryId = 1;

  /** The active documents, in the order they were added. */
  public readonly documents = signal<ActivePdfDocument[]>([]);
  /** The questions and answers, in the order they were sent. */
  public readonly entries = signal<PdfChatEntry[]>([]);
  /** The files of the last selection that were not added. */
  public readonly rejectedFiles = signal<RejectedPdfFile[]>([]);
  /** Whether an answer is being produced. */
  public readonly isAnswering = signal(false);
  /** Whether selected files are being read. */
  public readonly isReading = signal(false);
  /** Whether an answer is being produced or selected files are being read. */
  public readonly isBusy = computed(
    () => this.isAnswering() || this.isReading(),
  );
  /** The size of the active documents together, in bytes. */
  public readonly totalSize = computed(() =>
    this.documents().reduce((total, document) => total + document.size, 0),
  );
  /** Whether more documents can be added now. */
  public readonly canAddDocuments = computed(
    () => !this.isBusy() && this.documents().length < MAX_PDF_CHAT_DOCUMENTS,
  );
  /** Whether a question can be sent now. */
  public readonly canAsk = computed(
    () => this.documents().length > 0 && !this.isBusy(),
  );

  public constructor() {
    inject(DestroyRef).onDestroy(() =>
      this.documents().forEach((document) => URL.revokeObjectURL(document.url)),
    );
  }

  /**
   * Adds the selected files to the active documents. Each file is checked in
   * order against the active documents including the files accepted before
   * it; a file that fails a check or cannot be read is listed in
   * {@link rejectedFiles} and the others are still added. The files are added
   * together once all of them are read. Ignored while an answer is being
   * produced or other files are being read.
   * @param files The selected files, in the order they were selected.
   */
  public async addFiles(files: File[]): Promise<void> {
    if (this.isBusy()) {
      return;
    }

    // While the files are read, nothing else may change the documents, so the
    // copy taken here is still current when it is written back.
    this.isReading.set(true);
    try {
      const accepted = [...this.documents()];
      const rejected: RejectedPdfFile[] = [];
      for (const file of files) {
        const reason = this.validate(file, accepted);
        if (reason) {
          rejected.push({ fileName: file.name, reason });
          continue;
        }
        try {
          accepted.push(await this.toDocument(file));
        } catch {
          rejected.push({
            fileName: file.name,
            reason: PdfFileRejection.Unreadable,
          });
        }
      }

      this.documents.set(accepted);
      this.rejectedFiles.set(rejected);
    } finally {
      this.isReading.set(false);
    }
  }

  /**
   * Removes an active document and clears the list of rejected files. The
   * conversation stays, unless no document is left. Ignored while an answer is
   * being produced or selected files are being read.
   * @param name The file name of the document.
   */
  public removeDocument(name: string): void {
    if (this.isBusy()) {
      return;
    }

    const document = this.documents().find((item) => item.name === name);
    if (!document) {
      return;
    }
    URL.revokeObjectURL(document.url);
    this.documents.update((documents) =>
      documents.filter((item) => item !== document),
    );
    this.rejectedFiles.set([]);
    if (this.documents().length === 0) {
      this.entries.set([]);
    }
  }

  /** Clears the conversation. The active documents stay. */
  public clearConversation(): void {
    this.entries.set([]);
  }

  /**
   * Returns the address that opens an active document at a page.
   * @param source A source of an answer.
   * @returns The address, or `null` when the source names no active document or no page.
   */
  public sourceUrl(source: AnswerSource): string | null {
    if (source.page === null) {
      return null;
    }
    const document = this.documents().find(
      (item) => item.name === source.documentName,
    );
    return document ? `${document.url}#page=${source.page}` : null;
  }

  /**
   * Sends a question about the active documents and shows the answer while it
   * is produced. Ignored for an empty question, without an active document, or
   * while another answer is being produced.
   * @param question The question to ask.
   */
  public async ask(question: string): Promise<void> {
    const text = question.trim();
    if (!text || !this.canAsk()) {
      return;
    }

    const history = this.history();
    const documents = this.documents().map(({ name, data }) => ({
      name,
      data,
    }));
    const questionEntry = this.addEntry(PDF_CHAT_ROLE_USER, text);
    const answerEntry = this.addEntry(PDF_CHAT_ROLE_ASSISTANT, '');
    this.updateEntry(answerEntry.id, { status: PdfChatEntryStatus.Answering });
    this.isAnswering.set(true);

    try {
      const answer = await this.serviceClient.askPdfChat(
        { question: text, documents, history },
        (answerSoFar) =>
          this.updateEntry(answerEntry.id, {
            text: answerSoFar,
            body: answerSoFar,
          }),
      );
      const { body, sources } = this.sourcesParser.parse(answer);
      this.updateEntry(answerEntry.id, {
        text: answer,
        body,
        sources,
        status: PdfChatEntryStatus.Done,
      });
    } catch {
      this.entries.update((entries) =>
        entries.filter((entry) => entry.id !== answerEntry.id),
      );
      this.updateEntry(questionEntry.id, { status: PdfChatEntryStatus.Failed });
      this.toast.show(ANSWER_FAILED_MESSAGE);
    } finally {
      this.isAnswering.set(false);
    }
  }

  /**
   * Returns why a file cannot be added to the given documents.
   * @param file The selected file.
   * @param documents The active documents including the files accepted before it.
   * @returns The reason, or `null` when the file is accepted.
   */
  private validate(
    file: File,
    documents: ActivePdfDocument[],
  ): PdfFileRejection | null {
    const isPdf =
      file.type === PDF_MIME_TYPE ||
      (!file.type && file.name.toLowerCase().endsWith(PDF_EXTENSION));
    if (!isPdf) {
      return PdfFileRejection.NotAPdf;
    }
    if (documents.some((document) => document.name === file.name)) {
      return PdfFileRejection.DuplicateName;
    }
    if (documents.length >= MAX_PDF_CHAT_DOCUMENTS) {
      return PdfFileRejection.TooManyDocuments;
    }
    const totalSize = documents.reduce((total, item) => total + item.size, 0);
    if (totalSize + file.size > MAX_TOTAL_PDF_SIZE_BYTES) {
      return PdfFileRejection.DocumentsTooLarge;
    }
    return null;
  }

  /**
   * Builds an active document from an accepted file.
   * @param file The accepted file.
   * @returns The document.
   */
  private async toDocument(file: File): Promise<ActivePdfDocument> {
    const data = await this.readAsBase64(file);
    // A file the browser reports without a MIME type gets one, so the browser
    // opens it in its PDF viewer.
    const blob = file.type ? file : new Blob([file], { type: PDF_MIME_TYPE });
    return {
      name: file.name,
      size: file.size,
      data,
      url: URL.createObjectURL(blob),
    };
  }

  /**
   * Returns the completed entries as the history sent with the next question.
   * Failed questions are left out.
   * @returns The earlier messages, oldest first.
   */
  private history(): PdfChatMessage[] {
    return this.entries()
      .filter((entry) => entry.status === PdfChatEntryStatus.Done)
      .map((entry) => ({ role: entry.role, text: entry.text }));
  }

  /**
   * Appends a complete entry to the conversation.
   * @param role Who wrote the entry.
   * @param text The text of the entry.
   * @returns The new entry.
   */
  private addEntry(role: KnownPdfChatRole, text: string): PdfChatEntry {
    const entry: PdfChatEntry = {
      id: this.nextEntryId++,
      role,
      text,
      body: text,
      sources: [],
      status: PdfChatEntryStatus.Done,
    };
    this.entries.update((entries) => [...entries, entry]);
    return entry;
  }

  /**
   * Changes an entry of the conversation.
   * @param id The entry to change.
   * @param changes The fields to change.
   */
  private updateEntry(id: number, changes: Partial<PdfChatEntry>): void {
    this.entries.update((entries) =>
      entries.map((entry) =>
        entry.id === id ? { ...entry, ...changes } : entry,
      ),
    );
  }

  /**
   * Reads a file and returns its content base64-encoded.
   * @param file The file to read.
   * @returns The base64-encoded content, without a data URL prefix.
   */
  private readAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result);
        resolve(dataUrl.slice(dataUrl.indexOf(',') + 1));
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}
