import { describe, it, expect, vi, beforeEach } from 'vitest';

import { recognize, SpecialInput, TraceBuilder } from '@app/handwriting';
import type { RecognitionOutcome } from '@app/handwriting';
import { recognizeLocal } from './local_recognizer';

// Mock local_recognizer so we don't touch TensorFlow in these tests.
vi.mock('./local_recognizer', () => ({
  // Default to an async mock that behaves like the real function
  // signature (returns a promise).
  recognizeLocal: vi.fn(async () => null),
}));

declare const global: any;

// Mock XMLHttpRequest used by recognizeWithGoogle
class MockXHR {
  static instances: MockXHR[] = [];
  public onerror: (() => void) | null = null;
  private listeners: Record<string, ((this: MockXHR) => void)[]> = {};
  readyState = 0;
  status = 0;
  responseText = '';
  method = '';
  url = '';

  constructor() {
    MockXHR.instances.push(this);
  }

  addEventListener(type: string, listener: (this: MockXHR) => void) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(listener);
  }

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  setRequestHeader() {
    // no-op for tests
  }

  send() {
    // sending is controlled manually in tests by manipulating readyState/status/responseText
  }

  triggerReadyStateChange() {
    const handlers = this.listeners['readystatechange'] || [];
    handlers.forEach((handler) => handler.call(this));
  }
}

describe('buildOutcomeFromCandidates via recognize', () => {
  beforeEach(() => {
    MockXHR.instances = [];
    global.XMLHttpRequest = MockXHR as any;
  });

  it('interprets CLEAR markers from remote recognition', async () => {
    const xhrOutcome: RecognitionOutcome = await (async () => {
      // Arrange: remote returns a clear marker as first candidate
      const trace = new TraceBuilder().beginStroke().addPoint(0, 0).getTrace();
      const promise = recognize(trace, {});

      const xhr = MockXHR.instances[0];
      xhr.status = 200;
      xhr.readyState = 4;
      xhr.responseText = JSON.stringify([
        '',
        [[0, ['/', '1'], [], {}]],
      ]);
      xhr.triggerReadyStateChange();

      return promise;
    })();

    expect(xhrOutcome.input.special).toBe(SpecialInput.CLEAR);
    expect(xhrOutcome.candidates[0]).toBe('/');
  });

  it('interprets numeric candidates from remote recognition', async () => {
    const outcome = await (async () => {
      const trace = new TraceBuilder().beginStroke().addPoint(0, 0).getTrace();
      const promise = recognize(trace, {});

      const xhr = MockXHR.instances[0];
      xhr.status = 200;
      xhr.readyState = 4;
      xhr.responseText = JSON.stringify([
        '',
        [[0, ['3', '2'], [], {}]],
      ]);
      xhr.triggerReadyStateChange();

      return promise;
    })();

    expect(outcome.input.number).toBe(3);
    expect(outcome.candidates).toEqual(['3', '2']);
    expect(outcome.remoteCandidates).toEqual(['3', '2']);
  });

  it('falls back to local candidates when remote fails', async () => {
    const mockedRecognizeLocal = vi.mocked(recognizeLocal);
    mockedRecognizeLocal.mockResolvedValue({ candidates: ['7', '1'] } as any);

    const outcome = await (async () => {
      const trace = new TraceBuilder().beginStroke().addPoint(0, 0).getTrace();
      const promise = recognize(trace, {});

      const xhr = MockXHR.instances[0];
      xhr.status = 503;
      xhr.readyState = 4;
      xhr.triggerReadyStateChange();

      return promise;
    })();

    expect(outcome.input.number).toBe(7);
    expect(outcome.candidates).toEqual(['7', '1']);
    expect(outcome.localCandidates).toEqual(['7', '1']);
  });

  it('returns unknown special input when both paths fail', async () => {
    const mockedRecognizeLocal = vi.mocked(recognizeLocal);
    mockedRecognizeLocal.mockResolvedValue(null as any);

    const outcome = await (async () => {
      const trace = new TraceBuilder().beginStroke().addPoint(0, 0).getTrace();
      const promise = recognize(trace, {});

      const xhr = MockXHR.instances[0];
      xhr.status = 503;
      xhr.readyState = 4;
      xhr.triggerReadyStateChange();

      return promise;
    })();

    expect(outcome.input.special).toBe(SpecialInput.UNKONWN);
    expect(outcome.candidates).toEqual([]);
  });
});
