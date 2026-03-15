
export type Stroke = [number[], number[]];
export type Trace = Stroke[];

type Options = {
  width?: number;
  height?: number;
  language?: string;
  numOfWords?: number;
  numOfReturn?: number;
}
const defaultOptions: Options = {
  language: "en_US",
  numOfWords: 1,
  numOfReturn: 3,
};

export const recognize = function (trace: Trace, options: Options): Promise<unknown> {
  console.log('req strokes', trace);
  options = { ...defaultOptions, ...options };
  var data = JSON.stringify({
    "requests": [{
      "ink": trace,
      "language": options.language,
    }]
  });
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener("readystatechange", function () {
      if (this.readyState !== 4) return;
      if (this.status === 200) {
        var response = JSON.parse(this.responseText);
        var results: unknown[][];
        if (response.length === 1) {
          reject(new Error(response[0]));
          return;
        } else {
          results = response[1][0][1];
        }
        if (!!options.numOfWords) {
          results = results.filter(function (result) {
            return (result.length == options.numOfWords);
          });
        }
        if (!!options.numOfReturn) {
          results = results.slice(0, options.numOfReturn);
        }
        resolve(results);
      } else if (this.status === 403) {
        reject(new Error("access denied"));
      } else if (this.status === 503) {
        reject(new Error("can't connect to recognition server"));
      }
    });
    xhr.open("POST", "https://www.google.com.tw/inputtools/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8");
    xhr.setRequestHeader("content-type", "application/json");
    xhr.send(data);
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
