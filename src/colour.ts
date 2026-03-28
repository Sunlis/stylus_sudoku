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
