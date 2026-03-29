
export type Stroke = [number[], number[]];
export type Trace = Stroke[];

type Options = {
  width?: number;
  height?: number;
  language?: string;
};

const defaultOptions: Options = {
  language: "en_US",
};

type RecognitionResult = [
  string, // error code, empty if no error
  [
    number, // identifier
    string[], // recognition results
    unknown[], // ??
    unknown, // options?
  ][]
];

export enum SpecialInput {
  CLEAR,
  UNKONWN,
}

export type Input =
  | {
    number: number;
    special?: undefined;
  }
  | {
    number?: undefined;
    special: SpecialInput;
  };

export type RecognitionOutcome = {
  input: Input;
  candidates: string[];
};
import { recognizeLocal } from './local_recognizer';

function buildOutcomeFromCandidates(results: string[]): RecognitionOutcome {
  let input: Input = { special: SpecialInput.UNKONWN };
  for (const result of results) {
    if (result && '/\\-Xx'.indexOf(result[0].charAt(0)) !== -1) {
      input = { special: SpecialInput.CLEAR };
      break;
    }
    const parsed = parseInt(result as string, 10);
    if (isNaN(parsed)) {
      continue;
    }
    const firstDigit = parseInt(result[0], 10);
    if (!isNaN(firstDigit)) {
      input = { number: firstDigit };
      break;
    }
  }
  return { input, candidates: results };
}

function recognizeWithGoogle(trace: Trace, options: Options): Promise<RecognitionOutcome> {
  options = { ...defaultOptions, ...options };
  const data = JSON.stringify({
    requests: [{
      ink: trace,
      language: options.language,
    }],
  });

  return new Promise<string[]>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onerror = function () {
      reject(new Error('network error'));
    };
    xhr.addEventListener('readystatechange', function () {
      if (this.readyState !== 4) return;
      if (this.status === 200) {
        try {
          const response: RecognitionResult = JSON.parse(this.responseText) as RecognitionResult;
          const results: string[] = response[1][0][1];
          resolve(results);
        } catch (error) {
          reject(error);
        }
      } else if (this.status === 403) {
        reject(new Error('access denied'));
      } else if (this.status === 503) {
        reject(new Error("can't connect to recognition server"));
      } else {
        reject(new Error(`HTTP ${this.status}`));
      }
    });
    xhr.open('POST', 'https://www.google.com.tw/inputtools/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8');
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.send(data);
  }).then((results: string[]) => buildOutcomeFromCandidates(results));
}

export const recognize = function (trace: Trace, options: Options): Promise<RecognitionOutcome> {
  // First, try local recognition (if a model is available). If that fails
  // or yields no candidates, fall back to the existing Google API.
  return recognizeLocal(trace)
    .then((localResult) => {
      if (localResult && localResult.candidates.length > 0) {
        console.log('local result', localResult.candidates);
        return buildOutcomeFromCandidates(localResult.candidates);
      }
      return recognizeWithGoogle(trace, options);
    })
    .catch(() => recognizeWithGoogle(trace, options));
};

export class TraceBuilder {
  strokes: Stroke[] = [];

  beginStroke(): this {
    this.strokes.push([[], []]);
    return this;
  }

  addPoint(x: number, y: number): this {
    const stroke = this.strokes[this.strokes.length - 1];
    stroke[0].push(x);
    stroke[1].push(y);
    return this;
  }

  getTrace(): Trace {
    return this.strokes;
  }

  clear(): this {
    this.strokes = [];
    return this;
  }
}
