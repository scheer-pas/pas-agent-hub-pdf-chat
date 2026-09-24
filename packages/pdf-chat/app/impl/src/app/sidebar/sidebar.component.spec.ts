import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
  });

  it('composes the sidebar sections', () => {
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('app-help-links')).toBeTruthy();
    expect(el.querySelector('app-contact-links')).toBeTruthy();
  });
});
