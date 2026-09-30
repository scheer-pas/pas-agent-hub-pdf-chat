import { ComponentFixture, TestBed } from '@angular/core/testing';
import ServiceClient from '@pas-agent-hub-pdf-chat/pdf-chat-service-client';
import { ToastService } from '../toast/toast.service';
import { SUGGESTED_QUESTIONS } from './suggested-questions/suggested-questions.component';
import { PdfChatComponent } from './pdf-chat.component';
import { PdfChatSession } from './pdf-chat-session';

describe('PdfChatComponent', () => {
  let fixture: ComponentFixture<PdfChatComponent>;
  let session: PdfChatSession;
  let askPdfChat: jest.Mock;

  /** The rendered element of the component. */
  const element = (): HTMLElement => fixture.nativeElement;

  beforeEach(async () => {
    askPdfChat = jest
      .fn()
      .mockResolvedValue('Cats purr.\nSources: cats.pdf, page 1');
    Object.assign(URL, {
      createObjectURL: jest.fn(() => 'blob:cats'),
      revokeObjectURL: jest.fn(),
    });

    await TestBed.configureTestingModule({
      imports: [PdfChatComponent],
      providers: [
        { provide: ServiceClient, useValue: { askPdfChat } },
        { provide: ToastService, useValue: { show: jest.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PdfChatComponent);
    session = fixture.debugElement.injector.get(PdfChatSession);
    fixture.detectChanges();
  });

  /** Makes a small PDF the active document and renders the change. */
  const selectPdf = async (): Promise<void> => {
    await session.addFiles([
      new File(['%PDF'], 'cats.pdf', { type: 'application/pdf' }),
    ]);
    fixture.detectChanges();
  };

  it('shows only the upload area and the input while no document is active', () => {
    expect(element().querySelector('app-pdf-upload')).not.toBeNull();
    expect(element().querySelector('app-question-input')).not.toBeNull();
    expect(element().querySelector('app-suggested-questions')).toBeNull();
    expect(element().querySelector('app-chat-conversation')).toBeNull();
  });

  it('offers the three suggested questions while the conversation is empty', async () => {
    await selectPdf();

    const buttons = element().querySelectorAll(
      'app-suggested-questions button',
    );
    expect(
      Array.from(buttons).map((button) => button.textContent?.trim()),
    ).toEqual(SUGGESTED_QUESTIONS);
  });

  it('sends a suggested question and shows the conversation', async () => {
    await selectPdf();

    element()
      .querySelector<HTMLButtonElement>('app-suggested-questions button')
      ?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(askPdfChat).toHaveBeenCalled();
    const entries = element().querySelectorAll('app-chat-conversation .entry');
    expect(entries).toHaveLength(2);
    expect(entries[0].classList).toContain('question');
    expect(entries[1].classList).toContain('answer');
    expect(entries[1].querySelector('.bubble')?.textContent?.trim()).toBe(
      'Cats purr.',
    );
    const link = entries[1].querySelector<HTMLAnchorElement>('a.source');
    expect(link?.textContent).toBe('cats.pdf, page 1');
    expect(link?.getAttribute('href')).toBe('blob:cats#page=1');
    expect(link?.target).toBe('_blank');
  });

  it('shows a source whose document is no longer active as plain text', async () => {
    await selectPdf();
    askPdfChat.mockResolvedValueOnce('Dogs bark.\nSources: dogs.pdf, page 4');
    await session.ask('What about dogs?');
    fixture.detectChanges();

    const source = element().querySelector('app-chat-conversation .source');
    expect(source?.tagName).toBe('SPAN');
    expect(source?.classList).toContain('unlinked');
    expect(source?.textContent).toBe('dogs.pdf, page 4');
  });

  it('clears the conversation with the Clear chat button', async () => {
    await selectPdf();
    await session.ask('What is it about?');
    fixture.detectChanges();

    element().querySelector<HTMLButtonElement>('.clear')?.click();
    fixture.detectChanges();

    expect(session.entries()).toEqual([]);
    expect(element().querySelector('app-suggested-questions')).not.toBeNull();
  });

  it('marks a failed question in the conversation', async () => {
    await selectPdf();
    askPdfChat.mockRejectedValueOnce(new Error('offline'));
    await session.ask('What is it about?');
    fixture.detectChanges();

    const entry = element().querySelector('app-chat-conversation .entry');
    expect(entry?.classList).toContain('failed');
    expect(entry?.textContent).toContain('Not answered');
  });
});
