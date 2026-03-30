import { describe, it, expect, vi, beforeEach } from 'vitest';

import { loadDigitModel, recognizeLocal } from '@app/local_recognizer';
import type { Trace } from '@app/handwriting';

// Mock TensorFlow so tests don't require the real backend.
vi.mock('@tensorflow/tfjs', () => {
  const tensorMock = {
    data: vi.fn(async () => new Float32Array([0.1, 0.9, 0.05])),
    dispose: vi.fn(),
  };

  const tf: any = {
    tensor4d: vi.fn(() => tensorMock),
    zeros: vi.fn(() => tensorMock),
    loadLayersModel: vi.fn(async () => ({
      predict: vi.fn(() => tensorMock),
    })),
  };

  return tf;
});

// Provide a minimal document implementation for traceToTensor
beforeEach(() => {
  (global as any).document = {
    createElement: () => ({
      width: 0,
      height: 0,
      getContext: () => ({
        clearRect: () => {},
        strokeStyle: '',
        lineWidth: 0,
        lineCap: '',
        save: () => {},
        translate: () => {},
        scale: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        restore: () => {},
        getImageData: () => ({
          data: new Uint8ClampedArray(28 * 28 * 4),
        }),
      }),
    }),
  };
});

describe('loadDigitModel', () => {
  it('loads the model only once and caches the promise', async () => {
    const first = await loadDigitModel();
    const second = await loadDigitModel();

    expect(first).toBe(second);
  });
});

describe('recognizeLocal', () => {
  it('returns null for empty trace', async () => {
    const trace: Trace = [];
    const result = await recognizeLocal(trace);

    expect(result).toBeNull();
  });

  it('returns candidates for non-empty trace', async () => {
    const trace: Trace = [[[0, 1], [0, 1]]];
    const result = await recognizeLocal(trace);

    expect(result).not.toBeNull();
    expect(result!.candidates.length).toBeGreaterThan(0);
  });
});
