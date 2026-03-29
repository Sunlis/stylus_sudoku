import * as tf from '@tensorflow/tfjs';
import type { Trace } from './handwriting';

export interface LocalRecognitionResult {
  candidates: string[]; // best-first, as strings '0'..'9'
}

let modelPromise: Promise<tf.LayersModel> | null = null;

export function loadDigitModel(): Promise<tf.LayersModel> {
  if (!modelPromise) {
    const base = (import.meta as any).env?.BASE_URL ?? '/';
    const url = `${base}model/model.json`;
    modelPromise = tf.loadLayersModel(url);
  }
  return modelPromise;
}

function traceToTensor(trace: Trace, size = 28): tf.Tensor4D {
  if (typeof document === 'undefined') {
    // In non-browser environments (tests, SSR), skip local recognition.
    throw new Error('No DOM available for local recognition');
  }

  const off = document.createElement('canvas');
  off.width = size;
  off.height = size;
  const ctx = off.getContext('2d');
  if (!ctx) {
    throw new Error('No 2D context available');
  }

  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  // Compute bounding box over all strokes
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  trace.forEach(([xs, ys]) => {
    xs.forEach((x) => {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    });
    ys.forEach((y) => {
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });
  });

  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    // Empty trace
    return tf.zeros([1, size, size, 1]);
  }

  const w = maxX - minX || 1;
  const h = maxY - minY || 1;
  const scale = (0.8 * size) / Math.max(w, h); // leave a margin
  const offsetX = (size - w * scale) / 2;
  const offsetY = (size - h * scale) / 2;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  ctx.translate(-minX, -minY);

  trace.forEach(([xs, ys]) => {
    if (!xs.length) return;
    ctx.beginPath();
    ctx.moveTo(xs[0], ys[0]);
    for (let i = 1; i < xs.length; i++) {
      ctx.lineTo(xs[i], ys[i]);
    }
    ctx.stroke();
  });

  ctx.restore();

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    // Use alpha as the signal, since we draw black ink on a transparent
    // background. This makes stroke pixels bright and background dark.
    const alpha = imgData.data[i * 4 + 3];
    const v = alpha / 255;
    data[i] = v;
  }

  const tensor = tf.tensor4d(data, [1, size, size, 1]);
  return tensor;
}

export async function recognizeLocal(trace: Trace): Promise<LocalRecognitionResult | null> {
  if (!trace.length) {
    return null;
  }

  let model: tf.LayersModel;
  try {
    model = await loadDigitModel();
  } catch (err) {
    console.warn('Local digit model not available, falling back to remote recognition:', err);
    return null;
  }

  let x: tf.Tensor4D | null = null;
  let logits: tf.Tensor | null = null;
  try {
    x = traceToTensor(trace);
    logits = model.predict(x) as tf.Tensor;
    const probs = await logits.data();
    const indexed = Array.from(probs).map((p, i) => ({ p, i }));
    indexed.sort((a, b) => b.p - a.p);

    // Prefer Sudoku digits 1–9; fall back to whatever the model has.
    let top = indexed.filter(({ i }) => i >= 1 && i <= 9);
    if (top.length === 0) {
      top = indexed;
    }
    top = top.slice(0, 5);

    const candidates = top.map(({ i }) => String(i));
    return { candidates };
  } catch (err) {
    console.warn('Local digit recognition failed, falling back to remote:', err);
    return null;
  } finally {
    if (x) x.dispose();
    if (logits) logits.dispose();
  }
}
