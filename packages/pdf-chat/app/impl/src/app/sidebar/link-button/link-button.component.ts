import { Component, input } from '@angular/core';

/** Visual appearance of a link button. */
export type LinkButtonAppearance = 'button' | 'icon';

/**
 * Styles a native anchor or button as a sidebar action. Applied as an attribute
 * so the host stays a real `<a>` or `<button>`, preserving native link/button
 * behavior and accessibility; the consumer sets `href`/`target` (for links) or
 * `(click)` (for buttons) directly on the host element.
 *
 * Two appearances are supported: the default `'button'` renders a pill with the
 * projected label and an optional trailing {@link icon}; `'icon'` renders the
 * {@link icon} on its own as a standalone icon link (e.g. a social channel).
 */
@Component({
  selector: 'a[app-link-button], button[app-link-button]',
  templateUrl: './link-button.component.html',
  styleUrl: './link-button.component.scss',
  host: { '[class.icon-appearance]': "appearance() === 'icon'" },
})
export class LinkButtonComponent {
  /** Icon shown after the label (`button` appearance) or on its own (`icon`). */
  public readonly icon = input<string>();
  /** Visual appearance of the control. */
  public readonly appearance = input<LinkButtonAppearance>('button');
}
