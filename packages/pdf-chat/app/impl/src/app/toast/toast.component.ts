import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

/** Renders the transient error toast from the {@link ToastService}. */
@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
})
export class ToastComponent {
  private readonly toastService = inject(ToastService);

  /** The current toast message, or `null` when no toast is visible. */
  public readonly message = this.toastService.message;
}
