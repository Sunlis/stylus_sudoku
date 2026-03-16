
export type Stroke = [number[], number[]];
export type Trace = Stroke[];

type Options = {
  width?: number;
  height?: number;
  language?: string;
}
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

export const recognize = function (trace: Trace, options: Options): Promise<number|null> {
  options = { ...defaultOptions, ...options };
  var data = JSON.stringify({
    "requests": [{
      "ink": trace,
      "language": options.language,
    }]
  });
  return (new Promise<string[]>(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener("readystatechange", function () {
      if (this.readyState !== 4) return;
      if (this.status === 200) {
        try {
          var response: RecognitionResult = JSON.parse(this.responseText) as RecognitionResult;
          var results: string[] = response[1][0][1];
          resolve(results);
        } catch (error) {
          reject(error);
        }
      } else if (this.status === 403) {
        reject(new Error("access denied"));
      } else if (this.status === 503) {
        reject(new Error("can't connect to recognition server"));
      }
    });
    xhr.open("POST", "https://www.google.com.tw/inputtools/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8");
    xhr.setRequestHeader("content-type", "application/json");
    xhr.send(data);
  })).then((results: string[]) => {
    for (const result of results) {
      const parsed = parseInt(result as string, 10);
      if (isNaN(parsed)) {
        continue;
      }
      const firstDigit = parseInt(result[0], 10);
      if (!isNaN(firstDigit)) {
        return firstDigit;
      }
    }
    return null;
  });
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
