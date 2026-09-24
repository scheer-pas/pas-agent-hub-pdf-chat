import { TestBed } from '@angular/core/testing';
import { HeroComponent } from './hero.component';

describe('HeroComponent', () => {
  let component: HeroComponent;

  beforeEach(async () => {
    jest.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [HeroComponent],
    }).compileComponents();

    component = TestBed.createComponent(HeroComponent).componentInstance;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('launches the rocket after ten quick clicks and then removes it', () => {
    for (let i = 0; i < 10; i++) {
      component.onRocketClick();
    }
    expect(component.isLaunching()).toBe(true);

    jest.advanceTimersByTime(5000);
    expect(component.isLaunching()).toBe(false);
    expect(component.isGone()).toBe(true);
  });

  it('does not launch when clicks are too slow', () => {
    for (let i = 0; i < 9; i++) {
      component.onRocketClick();
    }
    // The click window elapses, resetting the counter before the tenth click.
    jest.advanceTimersByTime(1200);
    component.onRocketClick();

    expect(component.isLaunching()).toBe(false);
    expect(component.isGone()).toBe(false);
  });
});
