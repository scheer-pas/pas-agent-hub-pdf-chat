import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivePdfDocument,
  PdfChatSession,
  RejectedPdfFile,
} from '../pdf-chat-session';
import { PdfUploadComponent } from './pdf-upload.component';

describe('PdfUploadComponent', () => {
  let fixture: ComponentFixture<PdfUploadComponent>;
  let component: PdfUploadComponent;
  let documents: ReturnType<typeof signal<ActivePdfDocument[]>>;
  let session: {
    documents: typeof documents;
    rejectedFiles: ReturnType<typeof signal<RejectedPdfFile[]>>;
    isBusy: ReturnType<typeof signal<boolean>>;
    totalSize: ReturnType<typeof computed<number>>;
    canAddDocuments: ReturnType<typeof signal<boolean>>;
    addFiles: jest.Mock;
    removeDocument: jest.Mock;
  };
  const cats = new File(['%PDF'], 'cats.pdf', { type: 'application/pdf' });
  const dogs = new File(['%PDF'], 'dogs.pdf', { type: 'application/pdf' });

  /** The rendered element of the component. */
  const element = (): HTMLElement => fixture.nativeElement;

  /**
   * Builds a drag event carrying the given files.
   * @param files The dragged files.
   * @returns The event.
   */
  const dragEvent = (files: File[] = []): DragEvent =>
    ({
      preventDefault: jest.fn(),
      dataTransfer: { files },
    }) as unknown as DragEvent;

  beforeEach(async () => {
    documents = signal<ActivePdfDocument[]>([]);
    session = {
      documents,
      rejectedFiles: signal<RejectedPdfFile[]>([]),
      isBusy: signal(false),
      totalSize: computed(() =>
        documents().reduce((total, document) => total + document.size, 0),
      ),
      canAddDocuments: signal(true),
      addFiles: jest.fn().mockResolvedValue(undefined),
      removeDocument: jest.fn(),
    };

    await TestBed.configureTestingModule({ imports: [PdfUploadComponent] })
      .overrideComponent(PdfUploadComponent, {
        set: { providers: [{ provide: PdfChatSession, useValue: session }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PdfUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('passes all picked files to the session and resets the picker', async () => {
    const input = { files: [cats, dogs], value: 'C:\\fakepath\\cats.pdf' };

    await component.onFilesSelected({ target: input } as unknown as Event);

    expect(session.addFiles).toHaveBeenCalledWith([cats, dogs]);
    expect(input.value).toBe('');
  });

  it('ignores a picker change without files', async () => {
    await component.onFilesSelected({
      target: { files: null, value: '' },
    } as unknown as Event);

    expect(session.addFiles).not.toHaveBeenCalled();
  });

  it('marks the drop area while files are dragged over it', () => {
    const event = dragEvent();

    component.onDragOver(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.isDragOver()).toBe(true);

    component.onDragLeave();
    expect(component.isDragOver()).toBe(false);
  });

  it('passes all dropped files to the session', async () => {
    await component.onDrop(dragEvent([cats, dogs]));

    expect(session.addFiles).toHaveBeenCalledWith([cats, dogs]);
    expect(component.isDragOver()).toBe(false);
  });

  it('ignores a drop without files', async () => {
    await component.onDrop(dragEvent());

    expect(session.addFiles).not.toHaveBeenCalled();
  });

  it('lists each document with its size, the total, and a remove button per document', () => {
    documents.set([
      { name: 'cats.pdf', size: 2.5 * 1024 * 1024, data: 'x', url: 'blob:1' },
      { name: 'dogs.pdf', size: 1024 * 1024, data: 'y', url: 'blob:2' },
    ]);
    fixture.detectChanges();

    const items = element().querySelectorAll('.document');
    expect(items).toHaveLength(2);
    expect(items[0].querySelector('.size')?.textContent).toContain('2.5 MB');
    expect(element().querySelector('.summary')?.textContent).toContain(
      '2 of 5 documents',
    );
    expect(element().querySelector('.summary')?.textContent).toContain(
      '3.5 of 10 MB',
    );

    items[1].querySelector<HTMLButtonElement>('.remove')?.click();
    expect(session.removeDocument).toHaveBeenCalledWith('dogs.pdf');
  });

  it('hides the drop area when no more documents can be added', () => {
    session.canAddDocuments.set(false);
    fixture.detectChanges();

    expect(element().querySelector('.drop-area')).toBeNull();
  });

  it('lists each rejected file with its reason', () => {
    session.rejectedFiles.set([
      { fileName: 'notes.txt', reason: 'Only PDF files are supported.' },
    ]);
    fixture.detectChanges();

    expect(element().querySelector('.rejected')?.textContent).toContain(
      'notes.txt: Only PDF files are supported.',
    );
  });
});
