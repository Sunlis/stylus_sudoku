export type Color = {
  r: number;
  g: number;
  b: number;
  a: number;
};

export type Rgb = {
  r: number;
  g: number;
  b: number;
};

const clampChannel = (value: number): number => {
  return Math.max(0, Math.min(255, Math.round(value)));
};

export const hexToRgb = (hex: string): Rgb => {
  const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return { r, g, b };
};

export const desaturate = (rgb: Rgb, amount: number): Rgb => {
  const { r, g, b } = rgb;
  const gray = (r + g + b) / 3;
  const factor = 1 - amount;
  return {
    r: clampChannel(r * factor + gray * amount),
    g: clampChannel(g * factor + gray * amount),
    b: clampChannel(b * factor + gray * amount),
  };
};

export const darken = (rgb: Rgb, factor: number): Rgb => {
  return {
    r: clampChannel(rgb.r * factor),
    g: clampChannel(rgb.g * factor),
    b: clampChannel(rgb.b * factor),
  };
};

export const rgbToCss = (rgb: Rgb, a: number = 1): string => {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
};

export const getPerceivedBrightness = (rgb: Rgb): number => {
  const { r, g, b } = rgb;
  return (r * 299 + g * 587 + b * 114) / 1000;
};

export const getLayerRowColors = (baseHex: string) => {
  const base = hexToRgb(baseHex);
  const desaturated = desaturate(base, 0.4);
  const border = darken(desaturated, 0.7);
  const background = rgbToCss(desaturated);
  const borderCss = rgbToCss(border, 0.4);
  const brightness = getPerceivedBrightness(desaturated);
  const labelIsLight = brightness >= 140;
  return {
    background,
    border: borderCss,
    labelIsLight,
    backgroundRgb: desaturated,
  };
};

export function parseColor(input: string): Color | null {
  if (input.startsWith('#')) {
    const hex = input.slice(1);
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b, a: 1 };
    } else if (hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = parseInt(hex.slice(6, 8), 16) / 255;
      return { r, g, b, a };
    }
  } else if (input.startsWith('rgba(') && input.endsWith(')')) {
    const parts = input.slice(5, -1).split(',').map(s => s.trim());
    if (parts.length === 4) {
      const r = parseInt(parts[0]);
      const g = parseInt(parts[1]);
      const b = parseInt(parts[2]);
      const a = parseFloat(parts[3]);
      return { r, g, b, a };
    }
  } else if (input.startsWith('rgb(') && input.endsWith(')')) {
    const parts = input.slice(4, -1).split(',').map(s => s.trim());
    if (parts.length === 3) {
      const r = parseInt(parts[0]);
      const g = parseInt(parts[1]);
      const b = parseInt(parts[2]);
      return { r, g, b, a: 1 };
    }
  }
  return null;
}

export function colorToString(color: Color): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
}

export function stripAlpha(color: Color): Color {
  return { r: color.r, g: color.g, b: color.b, a: 1 };
}
