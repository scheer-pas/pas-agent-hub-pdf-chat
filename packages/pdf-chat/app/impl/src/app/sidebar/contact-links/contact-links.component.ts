import { Component } from '@angular/core';
import { LinkButtonComponent } from '../link-button/link-button.component';

/** Sidebar section linking to the product's social and contact channels. */
@Component({
  selector: 'app-contact-links',
  imports: [LinkButtonComponent],
  templateUrl: './contact-links.component.html',
  styleUrl: './contact-links.component.scss',
})
export class ContactLinksComponent {}
