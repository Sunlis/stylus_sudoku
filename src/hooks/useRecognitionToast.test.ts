import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useRecognitionToast } from './useRecognitionToast';
import type { RecognitionOutcome } from '@app/handwriting';
import { SpecialInput } from '@app/handwriting';

const makeOutcome = (overrides: Partial<RecognitionOutcome> = {}): RecognitionOutcome => ({
  input: { number: 3 },
  candidates: ['3', '8'],
  localCandidates: ['3', '8'],
  remoteCandidates: ['3'],
  ...overrides,
});

describe('useRecognitionToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with null candidates', () => {
    const { result } = renderHook(() => useRecognitionToast());
    expect(result.current.candidates).toBeNull();
  });

  it('showCandidates sets local and remote candidates from outcome', () => {
    const { result } = renderHook(() => useRecognitionToast());

    act(() => {
      result.current.showCandidates(makeOutcome());
    });

    expect(result.current.candidates).toEqual({
      local: ['3', '8'],
      remote: ['3'],
    });
  });

  it('omits remote when remoteCandidates is undefined', () => {
    const { result } = renderHook(() => useRecognitionToast());

    act(() => {
      result.current.showCandidates(makeOutcome({ remoteCandidates: undefined }));
    });

    expect(result.current.candidates?.remote).toBeUndefined();
  });

  it('auto-clears candidates after 4000 ms', () => {
    const { result } = renderHook(() => useRecognitionToast());

    act(() => {
      result.current.showCandidates(makeOutcome());
      vi.advanceTimersByTime(4000);
    });

    expect(result.current.candidates).toBeNull();
  });

  it('does not clear before 4000 ms have elapsed', () => {
    const { result } = renderHook(() => useRecognitionToast());

    act(() => {
      result.current.showCandidates(makeOutcome());
      vi.advanceTimersByTime(3999);
    });

    expect(result.current.candidates).not.toBeNull();
  });

  it('resets the auto-clear timer when showCandidates is called again', () => {
    const { result } = renderHook(() => useRecognitionToast());

    act(() => {
      result.current.showCandidates(makeOutcome());
      vi.advanceTimersByTime(3000);
      // Call again before the first timer would fire
      result.current.showCandidates(makeOutcome({ localCandidates: ['9'] }));
      vi.advanceTimersByTime(3000);
    });

    // 3s + 3s = 6s elapsed, but timer was reset at 3s so only 3s have passed
    expect(result.current.candidates).not.toBeNull();
  });

  it('clear immediately nulls candidates', () => {
    const { result } = renderHook(() => useRecognitionToast());

    act(() => { result.current.showCandidates(makeOutcome()); });
    act(() => { result.current.clear(); });

    expect(result.current.candidates).toBeNull();
  });

  it('clear cancels the pending auto-clear timeout', () => {
    const { result } = renderHook(() => useRecognitionToast());

    act(() => { result.current.showCandidates(makeOutcome()); });
    act(() => { result.current.clear(); });

    // Advance past when the original timeout would have fired — candidates should stay null
    act(() => { vi.advanceTimersByTime(4000); });

    expect(result.current.candidates).toBeNull();
  });

  it('calling clear when already null does not throw', () => {
    const { result } = renderHook(() => useRecognitionToast());
    expect(() => {
      act(() => { result.current.clear(); });
    }).not.toThrow();
  });

  it('clears the pending timeout on unmount so timers do not leak', () => {
    const { result, unmount } = renderHook(() => useRecognitionToast());

    act(() => { result.current.showCandidates(makeOutcome()); });

    // Unmounting should not throw even with a pending timer
    expect(() => unmount()).not.toThrow();
  });

  it('does not error after unmount when timer would have fired', () => {
    const { result, unmount } = renderHook(() => useRecognitionToast());

    act(() => { result.current.showCandidates(makeOutcome()); });
    unmount();

    // Should not throw even though the component is gone
    expect(() => {
      act(() => { vi.advanceTimersByTime(4000); });
    }).not.toThrow();
  });

  it('showCandidates passes localCandidates from outcome', () => {
    const { result } = renderHook(() => useRecognitionToast());

    act(() => {
      result.current.showCandidates(makeOutcome({ localCandidates: ['7', '1', '4'] }));
    });

    expect(result.current.candidates?.local).toEqual(['7', '1', '4']);
  });

  it('handles outcome with no localCandidates', () => {
    const { result } = renderHook(() => useRecognitionToast());

    act(() => {
      result.current.showCandidates(makeOutcome({ localCandidates: undefined }));
    });

    expect(result.current.candidates?.local).toBeUndefined();
  });

  it('showCandidates works with a CLEAR special input outcome', () => {
    const { result } = renderHook(() => useRecognitionToast());

    act(() => {
      result.current.showCandidates({
        input: { special: SpecialInput.CLEAR },
        candidates: ['X'],
        localCandidates: ['X'],
      });
    });

    expect(result.current.candidates).not.toBeNull();
  });
});
