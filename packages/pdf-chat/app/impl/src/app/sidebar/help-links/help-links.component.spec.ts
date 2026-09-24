import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HelpLinksComponent } from './help-links.component';

describe('HelpLinksComponent', () => {
  let fixture: ComponentFixture<HelpLinksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpLinksComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HelpLinksComponent);
    fixture.detectChanges();
  });

  it('renders documentation links that open in a new tab safely, each with an icon', () => {
    const anchors = Array.from(
      fixture.nativeElement.querySelectorAll<HTMLAnchorElement>('a'),
    );

    expect(anchors).toHaveLength(2);
    for (const anchor of anchors) {
      expect(anchor.getAttribute('href')).toBeTruthy();
      expect(anchor.target).toBe('_blank');
      expect(anchor.rel).toContain('noopener');
      expect(anchor.querySelector('img.icon')).toBeTruthy();
    }
  });
});
