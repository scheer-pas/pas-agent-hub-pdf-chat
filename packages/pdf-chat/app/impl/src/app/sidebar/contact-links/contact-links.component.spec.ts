import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactLinksComponent } from './contact-links.component';

describe('ContactLinksComponent', () => {
  let fixture: ComponentFixture<ContactLinksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactLinksComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactLinksComponent);
    fixture.detectChanges();
  });

  it('renders icon links that open in a new tab safely', () => {
    const anchors = Array.from(
      fixture.nativeElement.querySelectorAll<HTMLAnchorElement>('a'),
    );

    expect(anchors).toHaveLength(3);
    for (const anchor of anchors) {
      expect(anchor.getAttribute('href')).toBeTruthy();
      expect(anchor.target).toBe('_blank');
      expect(anchor.rel).toContain('noopener');
      expect(anchor.getAttribute('aria-label')).toBeTruthy();
      expect(anchor.querySelector('img.glyph')).toBeTruthy();
    }
  });
});
