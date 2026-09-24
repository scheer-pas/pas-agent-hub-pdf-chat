import { Component, signal } from '@angular/core';

/** Consecutive clicks on the hero rocket required to trigger the launch. */
const ROCKET_LAUNCH_CLICKS = 10;

/** Max milliseconds between rocket clicks for them to count as consecutive. */
const ROCKET_CLICK_WINDOW_MS = 1200;

/** Duration of the hero rocket launch animation, matching the CSS animation. */
const ROCKET_LAUNCH_MS = 5000;

/**
 * Hero section: announces that the app is ready and hosts a rocket easter egg.
 * Clicking the rocket {@link ROCKET_LAUNCH_CLICKS} times in quick succession
 * makes it launch and fly off the screen, after which it is gone for good.
 */
@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HeroComponent {
  /** True while the rocket launch animation is playing. */
  public readonly isLaunching = signal(false);
  /** True once the rocket has flown off and is removed from the page. */
  public readonly isGone = signal(false);

  /** Number of consecutive clicks on the rocket. */
  private clickCount = 0;
  /** Resets the consecutive-click counter when clicks stop coming in quickly. */
  private clickResetTimer: ReturnType<typeof setTimeout> | undefined;
  /** Marks the rocket gone once the launch animation finishes. */
  private launchTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Registers a rocket click. Once enough consecutive clicks arrive within the
   * time window, the launch animation plays and the rocket is removed afterwards.
   */
  public onRocketClick(): void {
    if (this.isLaunching()) return;
    clearTimeout(this.clickResetTimer);
    this.clickCount++;
    if (this.clickCount >= ROCKET_LAUNCH_CLICKS) {
      this.clickCount = 0;
      this.isLaunching.set(true);
      clearTimeout(this.launchTimer);
      this.launchTimer = setTimeout(() => {
        this.isLaunching.set(false);
        this.isGone.set(true);
      }, ROCKET_LAUNCH_MS);
      return;
    }
    this.clickResetTimer = setTimeout(() => {
      this.clickCount = 0;
    }, ROCKET_CLICK_WINDOW_MS);
  }
}
