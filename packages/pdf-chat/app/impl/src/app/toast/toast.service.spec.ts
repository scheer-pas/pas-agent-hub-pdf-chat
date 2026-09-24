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

  it('shows an error message and hides it after the timeout', () => {
    service.showError();
    expect(service.message()).not.toBeNull();

    jest.advanceTimersByTime(6500);
    expect(service.message()).toBeNull();
  });

  it('keeps only the newest message visible when shown repeatedly', () => {
    service.showError();
    jest.advanceTimersByTime(3000);
    service.showError();

    // The first auto-hide must not clear the second message early.
    jest.advanceTimersByTime(3500);
    expect(service.message()).not.toBeNull();

    jest.advanceTimersByTime(3000);
    expect(service.message()).toBeNull();
  });
});
