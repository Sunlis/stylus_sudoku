import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { CellContents } from '@app/types/board';
import type { Trace } from '@app/handwriting';

const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => (key in store ? store[key] : null)),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  } as unknown as Storage;
};

// Construct a fresh instance of the storage singleton for each test by
// resetting modules and re-importing via dynamic import so Vitest can
// apply path aliases correctly.
const freshUserStorage = async () => {
  vi.resetModules();
  const mod = await import('@app/storage');
  return mod.userStorage;
};

declare global {
  // eslint-disable-next-line no-var
  var localStorage: Storage;
}

beforeEach(() => {
  global.localStorage = createMockLocalStorage();
});

describe('UserStorage preferences', () => {
  it('uses default preferences when none are stored', async () => {
    const userStorage = await freshUserStorage();

    expect(userStorage.getDifficulty()).toBe('medium');
    expect(userStorage.getRecognitionDelay()).toBe(1000);
  });

  it('persists and retrieves difficulty and recognition delay', async () => {
    const userStorage = await freshUserStorage();

    userStorage.setDifficulty('extreme');
    userStorage.setRecognitionDelay(2000);

    const secondInstance = await freshUserStorage();

    expect(secondInstance.getDifficulty()).toBe('extreme');
    expect(secondInstance.getRecognitionDelay()).toBe(2000);
  });

  it('handles corrupted JSON in localStorage by falling back to defaults', async () => {
    // Manually inject invalid JSON
    global.localStorage.setItem('userPreferences', '{invalid json');

    const userStorage = await freshUserStorage();

    expect(userStorage.getDifficulty()).toBe('medium');
    expect(userStorage.getRecognitionDelay()).toBe(1000);
  });
});

describe('UserStorage board state', () => {
  it('persists and retrieves board state', async () => {
    const userStorage = await freshUserStorage();

    const board: CellContents[][] = [
      [
        { value: 1 } as CellContents,
        { value: 2 } as CellContents,
      ],
    ] as unknown as CellContents[][];

    userStorage.setBoardState(board);

    const secondInstance = await freshUserStorage();
    const stored = secondInstance.getBoardState();

    expect(stored).not.toBeNull();
    expect(stored![0][0].value).toBe(1);
    expect(stored![0][1].value).toBe(2);
  });
});

describe('UserStorage notes layers', () => {
  it('persists and retrieves arbitrary notes layers object', async () => {
    const userStorage = await freshUserStorage();

    const layers = { foo: 'bar', baz: 1 };
    userStorage.setNotesLayers(layers);

    const secondInstance = await freshUserStorage();
    const stored = secondInstance.getNotesLayers<typeof layers>();

    expect(stored).toEqual(layers);
  });
});

describe('UserStorage handwriting traces', () => {
  it('stores and retrieves individual traces by key', async () => {
    const userStorage = await freshUserStorage();

    const trace: Trace = [[[0, 1], [2, 3]]];
    userStorage.setHandwritingTrace('cell-1', trace);

    const secondInstance = await freshUserStorage();

    expect(secondInstance.getHandwritingTrace('cell-1')).toEqual(trace);
  });

  it('removes traces when set to null or empty', async () => {
    const userStorage = await freshUserStorage();

    const trace: Trace = [[[0], [1]]];
    userStorage.setHandwritingTrace('cell-1', trace);
    userStorage.setHandwritingTrace('cell-1', null);

    const secondInstance = await freshUserStorage();

    expect(secondInstance.getHandwritingTrace('cell-1')).toBeNull();
  });
});
