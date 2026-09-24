import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LinkButtonComponent } from './link-button.component';

@Component({
  imports: [LinkButtonComponent],
  template: `<a app-link-button href="/docs" icon="icons/launch.svg">Docs</a>`,
})
class AnchorHostComponent {}

@Component({
  imports: [LinkButtonComponent],
  template: `<button app-link-button>Press</button>`,
})
class ButtonHostComponent {}

@Component({
  imports: [LinkButtonComponent],
  template: `<a
    app-link-button
    appearance="icon"
    icon="icons/email.svg"
    href="/contact"
    aria-label="Contact"
  ></a>`,
})
class IconHostComponent {}

describe('LinkButtonComponent', () => {
  it('renders the projected label and the optional trailing icon on an anchor', async () => {
    await TestBed.configureTestingModule({
      imports: [AnchorHostComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(AnchorHostComponent);
    fixture.detectChanges();

    const anchor = fixture.nativeElement.querySelector('a');
    expect(anchor?.textContent).toContain('Docs');
    expect(anchor?.getAttribute('href')).toBe('/docs');
    expect(anchor?.querySelector('img.icon')).toBeTruthy();
    expect(anchor?.classList).not.toContain('icon-appearance');
  });

  it('omits the icon on a button when none is provided', async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonHostComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(ButtonHostComponent);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button');
    expect(button?.textContent).toContain('Press');
    expect(button?.querySelector('img')).toBeNull();
  });

  it('renders a standalone glyph in the icon appearance', async () => {
    await TestBed.configureTestingModule({
      imports: [IconHostComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(IconHostComponent);
    fixture.detectChanges();

    const anchor = fixture.nativeElement.querySelector('a');
    expect(anchor?.classList).toContain('icon-appearance');
    expect(anchor?.querySelector('img.glyph')).toBeTruthy();
    expect(anchor?.querySelector('img.icon')).toBeNull();
  });
});
