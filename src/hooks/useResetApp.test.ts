import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useResetApp } from './useResetApp';

describe('useResetApp', () => {
  let reloadSpy: ReturnType<typeof vi.fn>;
  let removeItemSpy: ReturnType<typeof vi.spyOn>;
  let mockCachesDelete: ReturnType<typeof vi.fn>;
  let mockGetRegistrations: ReturnType<typeof vi.fn>;
  let mockUnregister: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: reloadSpy },
    });

    removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    mockCachesDelete = vi.fn().mockResolvedValue(true);
    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: {
        keys: vi.fn().mockResolvedValue(['cache1', 'cache2']),
        delete: mockCachesDelete,
      },
    });

    mockUnregister = vi.fn().mockResolvedValue(true);
    mockGetRegistrations = vi.fn().mockResolvedValue([
      { unregister: mockUnregister },
    ]);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { getRegistrations: mockGetRegistrations },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a stable callback reference across re-renders', () => {
    const { result, rerender } = renderHook(() => useResetApp());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('does nothing when user cancels the confirmation dialog', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { result } = renderHook(() => useResetApp());

    await act(async () => { await result.current(); });

    expect(removeItemSpy).not.toHaveBeenCalled();
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it('clears userPreferences from localStorage when confirmed', async () => {
    const { result } = renderHook(() => useResetApp());

    await act(async () => { await result.current(); });

    expect(removeItemSpy).toHaveBeenCalledWith('userPreferences');
  });

  it('deletes all cache entries when confirmed', async () => {
    const { result } = renderHook(() => useResetApp());

    await act(async () => { await result.current(); });

    expect(mockCachesDelete).toHaveBeenCalledWith('cache1');
    expect(mockCachesDelete).toHaveBeenCalledWith('cache2');
  });

  it('unregisters all service workers when confirmed', async () => {
    const { result } = renderHook(() => useResetApp());

    await act(async () => { await result.current(); });

    expect(mockGetRegistrations).toHaveBeenCalled();
    expect(mockUnregister).toHaveBeenCalled();
  });

  it('reloads the page after all cleanup steps', async () => {
    const { result } = renderHook(() => useResetApp());

    await act(async () => { await result.current(); });

    expect(reloadSpy).toHaveBeenCalled();
  });

  it('still reloads when localStorage.removeItem throws', async () => {
    removeItemSpy.mockImplementation(() => { throw new Error('storage quota exceeded'); });
    const { result } = renderHook(() => useResetApp());

    await act(async () => { await result.current(); });

    expect(reloadSpy).toHaveBeenCalled();
  });

  it('still reloads when caches.keys throws', async () => {
    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: { keys: vi.fn().mockRejectedValue(new Error('cache error')), delete: mockCachesDelete },
    });
    const { result } = renderHook(() => useResetApp());

    await act(async () => { await result.current(); });

    expect(reloadSpy).toHaveBeenCalled();
  });

  it('still reloads when serviceWorker.getRegistrations throws', async () => {
    mockGetRegistrations.mockRejectedValue(new Error('sw error'));
    const { result } = renderHook(() => useResetApp());

    await act(async () => { await result.current(); });

    expect(reloadSpy).toHaveBeenCalled();
  });

  it('skips cache cleanup when the caches API is absent', async () => {
    Object.defineProperty(window, 'caches', { configurable: true, value: undefined });
    const { result } = renderHook(() => useResetApp());

    await act(async () => { await result.current(); });

    expect(reloadSpy).toHaveBeenCalled();
  });

  it('skips service worker cleanup when the serviceWorker API is absent', async () => {
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: undefined });
    const { result } = renderHook(() => useResetApp());

    await act(async () => { await result.current(); });

    expect(reloadSpy).toHaveBeenCalled();
  });
});
