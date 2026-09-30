import { TestBed } from '@angular/core/testing';
import ServiceClient from '@pas-agent-hub-pdf-chat/pdf-chat-service-client';
import { ToastService } from '../toast/toast.service';
import {
  ANSWER_FAILED_MESSAGE,
  MAX_TOTAL_PDF_SIZE_BYTES,
  PdfChatEntryStatus,
  PdfFileRejection,
  PdfChatSession,
} from './pdf-chat-session';

describe('PdfChatSession', () => {
  const toast = { show: jest.fn() };
  let askPdfChat: jest.Mock;
  let createObjectURL: jest.Mock;
  let revokeObjectURL: jest.Mock;
  let session: PdfChatSession;
  let urlCount: number;

  /**
   * Builds a PDF file.
   * @param name The file name.
   * @param content The file content.
   * @param type The MIME type.
   * @returns The file.
   */
  const pdfFile = (
    name = 'cats.pdf',
    content = '%PDF-1.4',
    type = 'application/pdf',
  ): File => new File([content], name, { type });

  /**
   * Builds a PDF file that reports the given size.
   * @param name The file name.
   * @param size The reported size in bytes.
   * @returns The file.
   */
  const sizedPdf = (name: string, size: number): File => {
    const file = pdfFile(name);
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  /** Makes cats.pdf the only active document. */
  const addCats = (): Promise<void> => session.addFiles([pdfFile()]);

  beforeEach(() => {
    jest.clearAllMocks();
    urlCount = 0;
    askPdfChat = jest
      .fn()
      .mockResolvedValue('Cats purr.\nSources: cats.pdf, page 2');
    createObjectURL = jest.fn(() => `blob:pdf-${++urlCount}`);
    revokeObjectURL = jest.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });

    TestBed.configureTestingModule({
      providers: [
        PdfChatSession,
        { provide: ServiceClient, useValue: { askPdfChat } },
        { provide: ToastService, useValue: toast },
      ],
    });
    session = TestBed.inject(PdfChatSession);
  });

  describe('addFiles', () => {
    it('adds PDFs with their name, size, base64 content, and an address', async () => {
      await session.addFiles([pdfFile(), pdfFile('dogs.pdf', '%PDF-2')]);

      expect(session.documents()).toEqual([
        {
          name: 'cats.pdf',
          size: 8,
          data: btoa('%PDF-1.4'),
          url: 'blob:pdf-1',
        },
        { name: 'dogs.pdf', size: 6, data: btoa('%PDF-2'), url: 'blob:pdf-2' },
      ]);
      expect(session.totalSize()).toBe(14);
      expect(session.rejectedFiles()).toEqual([]);
    });

    it('adds to the documents already active', async () => {
      await addCats();

      await session.addFiles([pdfFile('dogs.pdf')]);

      expect(session.documents().map((item) => item.name)).toEqual([
        'cats.pdf',
        'dogs.pdf',
      ]);
    });

    it('gives a .pdf file without a MIME type a PDF address', async () => {
      await session.addFiles([pdfFile('report.PDF', '%PDF', '')]);

      expect(session.documents()[0].name).toBe('report.PDF');
      expect((createObjectURL.mock.calls[0][0] as Blob).type).toBe(
        'application/pdf',
      );
    });

    it('rejects a file the browser cannot read and still adds the others', async () => {
      const readAsDataURL = FileReader.prototype.readAsDataURL;
      const read = jest
        .spyOn(FileReader.prototype, 'readAsDataURL')
        .mockImplementation(function (this: FileReader, blob: Blob) {
          if ((blob as File).name === 'broken.pdf') {
            this.onerror?.(
              new ProgressEvent('error') as ProgressEvent<FileReader>,
            );
            return;
          }
          readAsDataURL.call(this, blob);
        });

      await session.addFiles([pdfFile('broken.pdf'), pdfFile('dogs.pdf')]);
      read.mockRestore();

      expect(session.documents().map((item) => item.name)).toEqual([
        'dogs.pdf',
      ]);
      expect(session.rejectedFiles()).toEqual([
        { fileName: 'broken.pdf', reason: PdfFileRejection.Unreadable },
      ]);
      expect(createObjectURL).toHaveBeenCalledTimes(1);
    });

    it('blocks asking, adding and removing while files are being read', async () => {
      await addCats();

      const reading = session.addFiles([pdfFile('dogs.pdf')]);

      expect(session.isReading()).toBe(true);
      expect(session.canAsk()).toBe(false);
      expect(session.canAddDocuments()).toBe(false);
      session.removeDocument('cats.pdf');
      await session.addFiles([pdfFile('birds.pdf')]);
      await reading;

      expect(session.documents().map((item) => item.name)).toEqual([
        'cats.pdf',
        'dogs.pdf',
      ]);
      expect(session.isReading()).toBe(false);
      expect(session.canAsk()).toBe(true);
    });

    it('rejects each failing file with its reason and still adds the others', async () => {
      await addCats();

      await session.addFiles([
        pdfFile('notes.txt', 'hi', 'text/plain'),
        pdfFile('cats.pdf'),
        pdfFile('dogs.pdf'),
      ]);

      expect(session.rejectedFiles()).toEqual([
        { fileName: 'notes.txt', reason: PdfFileRejection.NotAPdf },
        { fileName: 'cats.pdf', reason: PdfFileRejection.DuplicateName },
      ]);
      expect(session.documents().map((item) => item.name)).toEqual([
        'cats.pdf',
        'dogs.pdf',
      ]);
    });

    it('rejects a sixth document', async () => {
      await session.addFiles(
        ['1', '2', '3', '4', '5', '6'].map((name) => pdfFile(`${name}.pdf`)),
      );

      expect(session.documents()).toHaveLength(5);
      expect(session.canAddDocuments()).toBe(false);
      expect(session.rejectedFiles()).toEqual([
        { fileName: '6.pdf', reason: PdfFileRejection.TooManyDocuments },
      ]);
    });

    it('rejects a file that makes the documents larger than 10 MB together', async () => {
      await session.addFiles([
        sizedPdf('big.pdf', MAX_TOTAL_PDF_SIZE_BYTES - 10),
        sizedPdf('small.pdf', 10),
        sizedPdf('one-too-many.pdf', 1),
      ]);

      expect(session.documents().map((item) => item.name)).toEqual([
        'big.pdf',
        'small.pdf',
      ]);
      expect(session.rejectedFiles()).toEqual([
        {
          fileName: 'one-too-many.pdf',
          reason: PdfFileRejection.DocumentsTooLarge,
        },
      ]);
    });

    it('replaces the rejected files with the result of the next selection', async () => {
      await session.addFiles([pdfFile('notes.txt', 'hi', 'text/plain')]);

      await addCats();

      expect(session.rejectedFiles()).toEqual([]);
    });
  });

  describe('removeDocument', () => {
    it('removes the document, frees its address, and keeps the conversation', async () => {
      await session.addFiles([pdfFile(), pdfFile('dogs.pdf')]);
      await session.ask('What is it about?');
      session.rejectedFiles.set([{ fileName: 'x', reason: 'y' }]);

      session.removeDocument('cats.pdf');

      expect(session.documents().map((item) => item.name)).toEqual([
        'dogs.pdf',
      ]);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:pdf-1');
      expect(session.entries()).toHaveLength(2);
      expect(session.rejectedFiles()).toEqual([]);
    });

    it('clears the conversation when the last document is removed', async () => {
      await addCats();
      await session.ask('What is it about?');

      session.removeDocument('cats.pdf');

      expect(session.documents()).toEqual([]);
      expect(session.entries()).toEqual([]);
    });

    it('ignores a name that is not active', async () => {
      await addCats();

      session.removeDocument('dogs.pdf');

      expect(session.documents()).toHaveLength(1);
      expect(revokeObjectURL).not.toHaveBeenCalled();
    });
  });

  it('frees the addresses of all documents when the session ends', async () => {
    await session.addFiles([pdfFile(), pdfFile('dogs.pdf')]);

    TestBed.resetTestingModule();

    expect(revokeObjectURL.mock.calls).toEqual([
      ['blob:pdf-1'],
      ['blob:pdf-2'],
    ]);
  });

  it('clears the conversation and keeps the documents', async () => {
    await addCats();
    await session.ask('What is it about?');

    session.clearConversation();

    expect(session.entries()).toEqual([]);
    expect(session.documents()).toHaveLength(1);
  });

  describe('sourceUrl', () => {
    it('opens an active document at the named page', async () => {
      await addCats();

      expect(
        session.sourceUrl({
          label: 'cats.pdf, page 2',
          documentName: 'cats.pdf',
          page: 2,
        }),
      ).toBe('blob:pdf-1#page=2');
    });

    it('returns null for a document that is not active or a source without a page', async () => {
      await addCats();

      expect(
        session.sourceUrl({ label: 'x', documentName: 'dogs.pdf', page: 1 }),
      ).toBeNull();
      expect(
        session.sourceUrl({ label: 'x', documentName: null, page: null }),
      ).toBeNull();
    });
  });

  describe('ask', () => {
    it('does nothing without an active document', async () => {
      await session.ask('What is it about?');

      expect(askPdfChat).not.toHaveBeenCalled();
      expect(session.canAsk()).toBe(false);
    });

    it('does nothing for a question made only of spaces', async () => {
      await addCats();

      await session.ask('   ');

      expect(askPdfChat).not.toHaveBeenCalled();
    });

    it('sends the trimmed question with all documents and splits off the sources of the answer', async () => {
      await session.addFiles([pdfFile(), pdfFile('dogs.pdf', '%PDF-2')]);

      await session.ask('  What is it about?  ');

      expect(askPdfChat).toHaveBeenCalledWith(
        {
          question: 'What is it about?',
          documents: [
            { name: 'cats.pdf', data: btoa('%PDF-1.4') },
            { name: 'dogs.pdf', data: btoa('%PDF-2') },
          ],
          history: [],
        },
        expect.any(Function),
      );
      expect(session.entries()[1]).toEqual(
        expect.objectContaining({
          role: 'assistant',
          text: 'Cats purr.\nSources: cats.pdf, page 2',
          body: 'Cats purr.',
          sources: [
            { label: 'cats.pdf, page 2', documentName: 'cats.pdf', page: 2 },
          ],
          status: PdfChatEntryStatus.Done,
        }),
      );
    });

    it('sends the earlier completed messages, sources line included, as history', async () => {
      await addCats();
      await session.ask('First?');

      await session.ask('Second?');

      expect(askPdfChat.mock.calls[1][0].history).toEqual([
        { role: 'user', text: 'First?' },
        { role: 'assistant', text: 'Cats purr.\nSources: cats.pdf, page 2' },
      ]);
    });

    it('shows the answer while it is produced and blocks questions and document changes', async () => {
      await addCats();
      let finish: (answer: string) => void = () => undefined;
      askPdfChat.mockImplementation(
        (_request, onProgress: (answerSoFar: string) => void) =>
          new Promise<string>((resolve) => {
            onProgress('Cats');
            finish = resolve;
          }),
      );

      const pending = session.ask('What is it about?');

      expect(session.canAsk()).toBe(false);
      expect(session.canAddDocuments()).toBe(false);
      expect(session.entries()[1]).toEqual(
        expect.objectContaining({
          body: 'Cats',
          status: PdfChatEntryStatus.Answering,
        }),
      );
      await session.ask('Another?');
      await session.addFiles([pdfFile('dogs.pdf')]);
      session.removeDocument('cats.pdf');
      expect(askPdfChat).toHaveBeenCalledTimes(1);
      expect(session.documents().map((item) => item.name)).toEqual([
        'cats.pdf',
      ]);

      finish('Cats purr.');
      await pending;
      expect(session.isAnswering()).toBe(false);
    });

    it('marks the question as failed, drops the answer, and shows a toast when it fails', async () => {
      await addCats();
      askPdfChat.mockRejectedValueOnce(new Error('offline'));

      await session.ask('What is it about?');

      expect(session.entries()).toEqual([
        expect.objectContaining({
          role: 'user',
          text: 'What is it about?',
          status: PdfChatEntryStatus.Failed,
        }),
      ]);
      expect(toast.show).toHaveBeenCalledWith(ANSWER_FAILED_MESSAGE);
      expect(session.isAnswering()).toBe(false);
    });

    it('leaves a failed question out of the history', async () => {
      await addCats();
      askPdfChat.mockRejectedValueOnce(new Error('offline'));
      await session.ask('Failed?');

      await session.ask('Next?');

      expect(askPdfChat.mock.calls[1][0].history).toEqual([]);
    });
  });
});
