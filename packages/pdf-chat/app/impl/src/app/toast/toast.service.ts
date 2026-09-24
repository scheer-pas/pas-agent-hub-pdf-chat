import { Injectable, signal } from '@angular/core';

/** Milliseconds the error toast stays visible before it disappears automatically. */
const TOAST_VISIBLE_MS = 6500;

/** Playful error messages (all punning on the "PAS" brand name), picked at random. */
const TOAST_MESSAGES = [
  "Oops — that request didn't PAS. Please try again.",
  "Well, that didn't come to PAS. Give it another go.",
  'That one shall not PAS. Please try again.',
  'Looks like your request needs a hall PAS. Try again.',
  'Houston, we have a PAS-ing problem. Please try again.',
  "This request couldn't make the PAS. Try once more.",
];

/** Shows a transient, error toast with a randomly chosen playful message. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  /** The current toast message, or `null` when no toast is visible. */
  public readonly message = signal<string | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Shows an error toast with a randomly chosen message. Any previously
   * scheduled auto-hide is cancelled so the full duration applies to the newest
   * message.
   */
  public showError(): void {
    const message =
      TOAST_MESSAGES[Math.floor(Math.random() * TOAST_MESSAGES.length)];
    this.message.set(message);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.message.set(null), TOAST_VISIBLE_MS);
  }
}
