
export function throttle<T extends unknown[]>(cb: (...args: T) => void, delay: number): (...args: T) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined = undefined;
  let lastCall: T | undefined = undefined;
  return (...args: T) => {
    if (timeout) {
      lastCall = args;
      return;
    }
    timeout = setTimeout(() => {
      timeout = undefined;
      if (lastCall) {
        cb(...lastCall);
        lastCall = undefined;
      }
    }, delay);
    cb(...args);
    lastCall = undefined;
  };
}
