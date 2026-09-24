import { Component } from '@angular/core';
import { ContactLinksComponent } from './contact-links/contact-links.component';
import { HelpLinksComponent } from './help-links/help-links.component';

/**
 * Right-column help sidebar. Composes the section subcomponents (help links,
 * contact links).
 */
@Component({
  selector: 'app-sidebar',
  imports: [HelpLinksComponent, ContactLinksComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {}
