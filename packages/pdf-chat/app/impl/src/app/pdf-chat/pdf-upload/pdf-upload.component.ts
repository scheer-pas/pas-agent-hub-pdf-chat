import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MAX_PDF_CHAT_DOCUMENTS } from '@pas-agent-hub-pdf-chat/pdf-chat-service-types';
import { PdfChatSession } from '../pdf-chat-session';

/** Bytes in one megabyte, for showing file sizes. */
const BYTES_PER_MB = 1024 * 1024;

/**
 * Upload area of the PDF chat. Adds PDFs from the file picker or by
 * drag-and-drop, lists the active documents with their sizes, and removes a
 * document on request.
 */
@Component({
  selector: 'app-pdf-upload',
  imports: [DecimalPipe],
  templateUrl: './pdf-upload.component.html',
  styleUrl: './pdf-upload.component.scss',
})
export class PdfUploadComponent {
  /** The documents and conversation of the page. */
  protected readonly session = inject(PdfChatSession);
  /** Bytes in one megabyte. */
  protected readonly bytesPerMb = BYTES_PER_MB;
  /** Largest number of active documents. */
  protected readonly maxDocuments = MAX_PDF_CHAT_DOCUMENTS;
  /** Whether files are being dragged over the drop area. */
  public readonly isDragOver = signal(false);

  /**
   * Adds the files chosen in the file picker and resets the picker, so the
   * same files can be chosen again.
   * @param event The change event of the file input.
   */
  public async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    await this.add(files);
  }

  /**
   * Marks the drop area while files are dragged over it.
   * @param event The dragover event.
   */
  public onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  /** Clears the mark when the dragged files leave the drop area. */
  public onDragLeave(): void {
    this.isDragOver.set(false);
  }

  /**
   * Adds the dropped files.
   * @param event The drop event.
   */
  public async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.isDragOver.set(false);
    await this.add(Array.from(event.dataTransfer?.files ?? []));
  }

  /**
   * Passes the files to the session, unless there are none.
   * @param files The files to add.
   */
  private async add(files: File[]): Promise<void> {
    if (files.length === 0) {
      return;
    }
    await this.session.addFiles(files);
  }
}
