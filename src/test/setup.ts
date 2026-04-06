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

// jsdom does not implement PointerEvent; extend MouseEvent with pointer-specific fields.
if (typeof PointerEvent === 'undefined') {
  class PointerEvent extends MouseEvent {
    public pointerId: number;
    public pointerType: string;
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.pointerType = params.pointerType ?? 'mouse';
    }
  }
  (globalThis as any).PointerEvent = PointerEvent;
}
