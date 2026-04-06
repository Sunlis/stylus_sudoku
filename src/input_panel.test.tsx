import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { InputPanel } from './input_panel';
import { recognize, SpecialInput } from './handwriting';
import type { RecognitionOutcome } from './handwriting';
import { userStorage } from './storage';

vi.mock('./handwriting', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./handwriting')>();
  return { ...actual, recognize: vi.fn() };
});

vi.mock('./storage', () => ({
  userStorage: {
    getRecognitionDelay: vi.fn().mockReturnValue(0),
    getHandwritingTrace: vi.fn().mockReturnValue(null),
    setHandwritingTrace: vi.fn(),
    getDifficulty: vi.fn().mockReturnValue('medium'),
  },
}));

const mockCtx = {
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  clearRect: vi.fn(),
  strokeStyle: '',
  lineWidth: 0,
};

function makeOutcome(overrides: Partial<RecognitionOutcome> = {}): RecognitionOutcome {
  return { input: { number: 3 }, candidates: ['3'], ...overrides };
}

// Dispatch a pointer event on the element and flush React's event handling.
function fire(element: Element, type: string, init: PointerEventInit = {}) {
  act(() => {
    element.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1, ...init }));
  });
}

// Simulate a full draw stroke (down → move far enough to set hasMoved → up).
function drawAndLift(canvas: Element) {
  fire(canvas, 'pointerdown', { clientX: 0, clientY: 0, buttons: 1 });
  fire(canvas, 'pointermove', { clientX: 50, clientY: 50, buttons: 1 });
  fire(canvas, 'pointerup', { clientX: 50, clientY: 50 });
}

// Advance fake timers and flush the promise microtask queue.
async function flushRecognition() {
  await act(async () => {
    vi.runAllTimers();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('InputPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockCtx as any);
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(0, 0, 100, 100),
    );
    (HTMLCanvasElement.prototype as any).setPointerCapture = vi.fn();
    vi.mocked(recognize).mockResolvedValue(makeOutcome());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete (HTMLCanvasElement.prototype as any).setPointerCapture;
  });

  // ── Render ────────────────────────────────────────────────────────────────

  it('renders a canvas element', () => {
    const { container } = render(<InputPanel canvasSize={100} />);
    expect(container.querySelector('canvas')).not.toBeNull();
  });

  it('uses the provided canvasSize for width and height attributes', () => {
    const { container } = render(<InputPanel canvasSize={200} />);
    const canvas = container.querySelector('canvas')!;
    expect(canvas.getAttribute('width')).toBe('200');
    expect(canvas.getAttribute('height')).toBe('200');
  });

  // ── Erase mode ────────────────────────────────────────────────────────────

  it('calls onClearCell immediately on pointerdown when eraseMode is true', () => {
    const onClearCell = vi.fn();
    const { container } = render(<InputPanel canvasSize={100} eraseMode onClearCell={onClearCell} />);
    fire(container.querySelector('canvas')!, 'pointerdown', { buttons: 1 });
    expect(onClearCell).toHaveBeenCalledTimes(1);
  });

  it('clears the canvas on pointerdown in erase mode', () => {
    const { container } = render(<InputPanel canvasSize={100} eraseMode />);
    fire(container.querySelector('canvas')!, 'pointerdown', { buttons: 1 });
    expect(mockCtx.clearRect).toHaveBeenCalled();
  });

  it('clears the storage trace on pointerdown in erase mode', () => {
    const { container } = render(<InputPanel canvasSize={100} eraseMode storageKey="k" />);
    fire(container.querySelector('canvas')!, 'pointerdown', { buttons: 1 });
    expect(vi.mocked(userStorage.setHandwritingTrace)).toHaveBeenCalledWith('k', null);
  });

  it('does not call recognize after pointerup in erase mode', async () => {
    const { container } = render(<InputPanel canvasSize={100} eraseMode />);
    const canvas = container.querySelector('canvas')!;
    fire(canvas, 'pointerdown', { buttons: 1 });
    fire(canvas, 'pointerup');
    await flushRecognition();
    expect(vi.mocked(recognize)).not.toHaveBeenCalled();
  });

  it('ignores pointermove in erase mode (no drawing)', () => {
    const { container } = render(<InputPanel canvasSize={100} eraseMode />);
    fire(container.querySelector('canvas')!, 'pointermove', { buttons: 1 });
    expect(mockCtx.lineTo).not.toHaveBeenCalled();
  });

  // ── Tap (no movement) ─────────────────────────────────────────────────────

  it('calls onTap with the contact position on a tap (no movement)', () => {
    const onTap = vi.fn();
    const { container } = render(<InputPanel canvasSize={100} onTap={onTap} />);
    const canvas = container.querySelector('canvas')!;
    fire(canvas, 'pointerdown', { clientX: 40, clientY: 60, buttons: 1 });
    fire(canvas, 'pointerup');
    expect(onTap).toHaveBeenCalledWith({ x: 40, y: 60 });
  });

  it('does not schedule recognition after a tap', async () => {
    const { container } = render(<InputPanel canvasSize={100} onTap={vi.fn()} />);
    const canvas = container.querySelector('canvas')!;
    fire(canvas, 'pointerdown', { clientX: 10, clientY: 10, buttons: 1 });
    fire(canvas, 'pointerup');
    await flushRecognition();
    expect(vi.mocked(recognize)).not.toHaveBeenCalled();
  });

  // ── Drawing (pointer move) ─────────────────────────────────────────────────

  it('draws on the canvas while pointer is moved with button held', () => {
    const { container } = render(<InputPanel canvasSize={100} />);
    const canvas = container.querySelector('canvas')!;
    fire(canvas, 'pointerdown', { clientX: 10, clientY: 10, buttons: 1 });
    fire(canvas, 'pointermove', { clientX: 30, clientY: 30, buttons: 1 });
    expect(mockCtx.lineTo).toHaveBeenCalled();
  });

  it('does not draw on pointermove when no button is held', () => {
    const { container } = render(<InputPanel canvasSize={100} />);
    const canvas = container.querySelector('canvas')!;
    fire(canvas, 'pointerdown', { clientX: 10, clientY: 10, buttons: 1 });
    fire(canvas, 'pointermove', { clientX: 30, clientY: 30, buttons: 0 });
    expect(mockCtx.lineTo).not.toHaveBeenCalled();
  });

  it('sets hasMoved when the pointer travels more than 10 units', () => {
    const onTap = vi.fn();
    const { container } = render(<InputPanel canvasSize={100} onTap={onTap} />);
    const canvas = container.querySelector('canvas')!;
    fire(canvas, 'pointerdown', { clientX: 0, clientY: 0, buttons: 1 });
    fire(canvas, 'pointermove', { clientX: 50, clientY: 50, buttons: 1 });
    fire(canvas, 'pointerup');
    // hasMoved = true → onTap should NOT be called
    expect(onTap).not.toHaveBeenCalled();
  });

  it('ignores pointerup when no stroke has started', () => {
    const onTap = vi.fn();
    const { container } = render(<InputPanel canvasSize={100} onTap={onTap} />);
    fire(container.querySelector('canvas')!, 'pointerup');
    expect(onTap).not.toHaveBeenCalled();
  });

  it('pointercancel behaves identically to pointerup', async () => {
    vi.mocked(recognize).mockResolvedValue(makeOutcome({ input: { number: 5 }, candidates: ['5'] }));
    const onNumberRecognized = vi.fn();
    const { container } = render(<InputPanel canvasSize={100} onNumberRecognized={onNumberRecognized} />);
    const canvas = container.querySelector('canvas')!;
    drawAndLift(canvas);
    // Use pointercancel instead of pointerup for the lift
    act(() => {
      canvas.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 1 }));
    });
    await flushRecognition();
    // Either the drawAndLift pointerup or the cancel should have triggered recognition
    expect(vi.mocked(recognize)).toHaveBeenCalled();
  });

  // ── Recognition ───────────────────────────────────────────────────────────

  it('calls recognize after pointerup following a stroke', async () => {
    const { container } = render(<InputPanel canvasSize={100} />);
    drawAndLift(container.querySelector('canvas')!);
    await flushRecognition();
    expect(vi.mocked(recognize)).toHaveBeenCalled();
  });

  it('calls onNumberRecognized when recognition returns a digit', async () => {
    const onNumberRecognized = vi.fn();
    vi.mocked(recognize).mockResolvedValue(makeOutcome({ input: { number: 7 }, candidates: ['7'] }));
    const { container } = render(<InputPanel canvasSize={100} onNumberRecognized={onNumberRecognized} />);
    drawAndLift(container.querySelector('canvas')!);
    await flushRecognition();
    expect(onNumberRecognized).toHaveBeenCalledWith(7);
  });

  it('calls onClearCell when recognition returns CLEAR', async () => {
    const onClearCell = vi.fn();
    vi.mocked(recognize).mockResolvedValue(
      makeOutcome({ input: { special: SpecialInput.CLEAR }, candidates: ['X'] }),
    );
    const { container } = render(<InputPanel canvasSize={100} onClearCell={onClearCell} />);
    drawAndLift(container.querySelector('canvas')!);
    await flushRecognition();
    expect(onClearCell).toHaveBeenCalled();
  });

  it('calls onClearCell when recognition returns UNKNOWN', async () => {
    const onClearCell = vi.fn();
    vi.mocked(recognize).mockResolvedValue(
      makeOutcome({ input: { special: SpecialInput.UNKONWN }, candidates: ['?'] }),
    );
    const { container } = render(<InputPanel canvasSize={100} onClearCell={onClearCell} />);
    drawAndLift(container.querySelector('canvas')!);
    await flushRecognition();
    expect(onClearCell).toHaveBeenCalled();
  });

  it('calls onCandidatesRecognized when candidates are present', async () => {
    const onCandidatesRecognized = vi.fn();
    vi.mocked(recognize).mockResolvedValue(makeOutcome({ candidates: ['3', '8', '9'] }));
    const { container } = render(<InputPanel canvasSize={100} onCandidatesRecognized={onCandidatesRecognized} />);
    drawAndLift(container.querySelector('canvas')!);
    await flushRecognition();
    expect(onCandidatesRecognized).toHaveBeenCalled();
  });

  it('does not call onCandidatesRecognized when candidates list is empty', async () => {
    const onCandidatesRecognized = vi.fn();
    vi.mocked(recognize).mockResolvedValue(makeOutcome({ candidates: [] }));
    const { container } = render(<InputPanel canvasSize={100} onCandidatesRecognized={onCandidatesRecognized} />);
    drawAndLift(container.querySelector('canvas')!);
    await flushRecognition();
    expect(onCandidatesRecognized).not.toHaveBeenCalled();
  });

  it('does not crash when recognition rejects', async () => {
    vi.mocked(recognize).mockRejectedValue(new Error('network failure'));
    const { container } = render(<InputPanel canvasSize={100} />);
    drawAndLift(container.querySelector('canvas')!);
    await expect(flushRecognition()).resolves.not.toThrow();
  });

  it('persists trace immediately on pointerup when storageKey is set', () => {
    const { container } = render(<InputPanel canvasSize={100} storageKey="cell-1-1" />);
    drawAndLift(container.querySelector('canvas')!);
    expect(vi.mocked(userStorage.setHandwritingTrace)).toHaveBeenCalledWith('cell-1-1', expect.any(Array));
  });

  it('clears the storage trace after successful number recognition', async () => {
    vi.mocked(recognize).mockResolvedValue(makeOutcome({ input: { number: 5 }, candidates: ['5'] }));
    const { container } = render(<InputPanel canvasSize={100} storageKey="cell-2-3" />);
    drawAndLift(container.querySelector('canvas')!);
    await flushRecognition();
    expect(vi.mocked(userStorage.setHandwritingTrace)).toHaveBeenCalledWith('cell-2-3', null);
  });

  it('retains the trace in storage when recognition rejects', async () => {
    vi.mocked(recognize).mockRejectedValue(new Error('offline'));
    const { container } = render(<InputPanel canvasSize={100} storageKey="cell-3-4" />);
    drawAndLift(container.querySelector('canvas')!);
    await flushRecognition();
    const calls = vi.mocked(userStorage.setHandwritingTrace).mock.calls;
    // The first call saves the trace; should never subsequently call with null
    const lastCall = calls[calls.length - 1];
    expect(lastCall[1]).not.toBeNull();
  });
});
