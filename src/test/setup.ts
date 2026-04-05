import '@testing-library/jest-dom';

// jsdom does not implement matchMedia; provide a minimal stub.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => { },
    removeEventListener: () => { },
    dispatchEvent: () => false,
  }),
});

// jsdom does not implement ResizeObserver; provide a minimal stub.
(globalThis as any).ResizeObserver = class {
  observe() { }
  unobserve() { }
  disconnect() { }
};
