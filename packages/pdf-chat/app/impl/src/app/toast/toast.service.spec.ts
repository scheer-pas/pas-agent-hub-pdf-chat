import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    jest.useFakeTimers();
    service = new ToastService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the given message and hides it after the timeout', () => {
    service.show('Something went wrong.');
    expect(service.message()).toBe('Something went wrong.');

    jest.advanceTimersByTime(6500);
    expect(service.message()).toBeNull();
  });

  it('keeps only the newest message visible when shown repeatedly', () => {
    service.show('First problem.');
    jest.advanceTimersByTime(3000);
    service.show('Second problem.');

    // The first auto-hide must not clear the second message early.
    jest.advanceTimersByTime(3500);
    expect(service.message()).toBe('Second problem.');

    jest.advanceTimersByTime(3000);
    expect(service.message()).toBeNull();
  });
});
