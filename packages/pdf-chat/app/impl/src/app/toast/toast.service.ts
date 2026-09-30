import { Injectable, signal } from '@angular/core';

/** Milliseconds the error toast stays visible before it disappears automatically. */
const TOAST_VISIBLE_MS = 6500;

/** Shows a transient error toast with a given message. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  /** The current toast message, or `null` when no toast is visible. */
  public readonly message = signal<string | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Shows an error toast with the given message. Any previously scheduled
   * auto-hide is cancelled so the full duration applies to the newest message.
   * @param message The message to show.
   */
  public show(message: string): void {
    this.message.set(message);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.message.set(null), TOAST_VISIBLE_MS);
  }
}
