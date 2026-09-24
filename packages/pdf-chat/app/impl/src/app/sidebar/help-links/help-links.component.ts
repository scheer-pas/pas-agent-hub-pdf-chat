import { Component } from '@angular/core';
import { LinkButtonComponent } from '../link-button/link-button.component';

/** Sidebar section linking to the getting-started documentation resources. */
@Component({
  selector: 'app-help-links',
  imports: [LinkButtonComponent],
  templateUrl: './help-links.component.html',
  styleUrl: './help-links.component.scss',
})
export class HelpLinksComponent {}
