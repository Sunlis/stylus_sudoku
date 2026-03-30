import { describe, it, expect } from 'vitest';

import { darken, desaturate, getLayerRowColors, getPerceivedBrightness, hexToRgb, rgbToCss } from '@app/colour';

describe('hexToRgb', () => {
  it('parses 6-digit hex with # prefix', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses 6-digit hex without # prefix', () => {
    expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
  });
});

describe('desaturate', () => {
  it('moves pure red towards grey when desaturated', () => {
    const red = { r: 255, g: 0, b: 0 };
    const result = desaturate(red, 0.5);
    expect(result.g).toBeGreaterThan(0);
    expect(result.b).toBeGreaterThan(0);
  });
});

describe('darken', () => {
  it('reduces brightness while clamping within range', () => {
    const color = { r: 200, g: 150, b: 100 };
    const darker = darken(color, 0.5);
    expect(darker.r).toBeLessThan(color.r);
    expect(darker.g).toBeLessThan(color.g);
    expect(darker.b).toBeLessThan(color.b);
    expect(darker.r).toBeGreaterThanOrEqual(0);
    expect(darker.g).toBeGreaterThanOrEqual(0);
    expect(darker.b).toBeGreaterThanOrEqual(0);
  });
});

describe('rgbToCss', () => {
  it('formats rgba string with default alpha', () => {
    expect(rgbToCss({ r: 10, g: 20, b: 30 })).toBe('rgba(10, 20, 30, 1)');
  });

  it('formats rgba string with explicit alpha', () => {
    expect(rgbToCss({ r: 10, g: 20, b: 30 }, 0.5)).toBe('rgba(10, 20, 30, 0.5)');
  });
});

describe('getPerceivedBrightness', () => {
  it('returns higher brightness for white than for black', () => {
    const bright = getPerceivedBrightness({ r: 255, g: 255, b: 255 });
    const dark = getPerceivedBrightness({ r: 0, g: 0, b: 0 });

    expect(bright).toBeGreaterThan(dark);
  });
});

describe('getLayerRowColors', () => {
  it('returns consistent structure based on base color', () => {
    const result = getLayerRowColors('#336699');

    expect(result.background).toMatch(/^rgba\(/);
    expect(result.border).toMatch(/^rgba\(/);
    expect(typeof result.labelIsLight).toBe('boolean');
    expect(result.backgroundRgb).toEqual(
      expect.objectContaining({ r: expect.any(Number), g: expect.any(Number), b: expect.any(Number) }),
    );
  });
});
