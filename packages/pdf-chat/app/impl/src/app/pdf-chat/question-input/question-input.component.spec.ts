import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivePdfDocument, PdfChatSession } from '../pdf-chat-session';
import { QuestionInputComponent } from './question-input.component';

describe('QuestionInputComponent', () => {
  let fixture: ComponentFixture<QuestionInputComponent>;
  let component: QuestionInputComponent;
  let session: {
    documents: ReturnType<typeof signal<ActivePdfDocument[]>>;
    canAsk: ReturnType<typeof signal<boolean>>;
    ask: jest.Mock;
  };

  /**
   * Builds a keydown event for the given key.
   * @param shiftKey Whether Shift is held.
   * @param key The pressed key.
   * @returns The event.
   */
  const keydown = (shiftKey: boolean, key = 'Enter'): KeyboardEvent =>
    new KeyboardEvent('keydown', { key, shiftKey, cancelable: true });

  beforeEach(async () => {
    session = {
      documents: signal<ActivePdfDocument[]>([
        { name: 'cats.pdf', size: 1, data: 'x', url: 'blob:1' },
      ]),
      canAsk: signal(true),
      ask: jest.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [QuestionInputComponent],
    })
      .overrideComponent(QuestionInputComponent, {
        set: { providers: [{ provide: PdfChatSession, useValue: session }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(QuestionInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sends the typed question and empties the input', async () => {
    component.question.set('What is it about?');

    await component.send();

    expect(session.ask).toHaveBeenCalledWith('What is it about?');
    expect(component.question()).toBe('');
  });

  it('does not send an empty question', async () => {
    component.question.set('   ');

    await component.send();

    expect(component.canSend()).toBe(false);
    expect(session.ask).not.toHaveBeenCalled();
  });

  it('does not send while a question cannot be asked', async () => {
    session.canAsk.set(false);
    component.question.set('What is it about?');

    await component.send();

    expect(session.ask).not.toHaveBeenCalled();
  });

  it('sends on Enter and keeps the line break of Shift+Enter', async () => {
    component.question.set('What is it about?');

    const shiftEnter = keydown(true);
    await component.onKeydown(shiftEnter);
    expect(shiftEnter.defaultPrevented).toBe(false);
    expect(session.ask).not.toHaveBeenCalled();

    const enter = keydown(false);
    await component.onKeydown(enter);
    expect(enter.defaultPrevented).toBe(true);
    expect(session.ask).toHaveBeenCalledWith('What is it about?');
  });

  it('ignores other keys', async () => {
    component.question.set('What is it about?');

    await component.onKeydown(keydown(false, 'a'));

    expect(session.ask).not.toHaveBeenCalled();
  });

  it('disables the input and asks for an upload while no document is active', async () => {
    session.documents.set([]);
    fixture.detectChanges();
    // The forms directive applies the disabled state asynchronously.
    await fixture.whenStable();

    const textarea: HTMLTextAreaElement =
      fixture.nativeElement.querySelector('textarea');
    expect(textarea.disabled).toBe(true);
    expect(component.placeholder()).toBe(
      'Upload a PDF to start asking questions',
    );
  });
});
