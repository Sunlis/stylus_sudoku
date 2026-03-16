import React from "react";
import Tesseract from "tesseract.js";
import { recognize, TraceBuilder } from "./handwriting";

const PEN_SIZE = 3;

interface Props {}

interface State {
  mouseDown: boolean;
  previousMouse?: { x: number; y: number };
}

export class InputPanel extends React.Component<Props, State> {
  canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
  tesseractWorker?: Tesseract.Worker;
  trace: TraceBuilder = new TraceBuilder();

  constructor(props: Props) {
    super(props);
    this.state = {
      mouseDown: false,
      previousMouse: undefined,
    };
  }

  componentDidMount(): void {
    this.canvasRef.current?.addEventListener(
      'touchmove',
      this.touchMove.bind(this),
      {passive: false});
  }
  componentWillUnmount(): void {
    this.canvasRef.current?.removeEventListener(
      'touchmove',
      this.touchMove.bind(this));
  }

  private touchMove(event: TouchEvent) {
    event.preventDefault();
    const canvas = this.canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const { x, y } = this.relativePosition(event);
    const previous = this.state.previousMouse ?? {x, y};
    ctx.fillStyle = 'blue';
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = PEN_SIZE;
    ctx.moveTo(previous.x, previous.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    this.trace.addPoint(x, y);
    this.setState({ previousMouse: { x, y } });
  }

  private relativePosition(event: TouchEvent) {
    const canvas = this.canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = event.touches[0].clientX - rect.left;
    const y = event.touches[0].clientY - rect.top;
    return { x, y };
  }

  render() {
    return (
      <div style={{
        touchAction: 'none',
      }}>
        <canvas
          style={{
            border: '2px solid red',
          }}
          ref={this.canvasRef}
          onTouchStart={(event) => {
            this.setState({ mouseDown: true });
            const canvas = this.canvasRef.current!;
            const ctx = canvas.getContext('2d')!;
            ctx.beginPath();
            this.trace.beginStroke();
          }}
          onTouchEnd={() => {
            this.setState({ mouseDown: false, previousMouse: undefined });
            const canvas = this.canvasRef.current!;
            const ctx = canvas.getContext('2d')!;
            ctx.closePath();
          }}
          width='250'
          height='250'></canvas>
        <button onClick={async () => {
          const canvas = this.canvasRef.current!;
          const ctx = canvas.getContext('2d')!;
          recognize(this.trace.getTrace(), { width: canvas.width, height: canvas.height }).then((results) => {
            console.log(`Google Handwriting recognized text: "${results}"`, results);
          }).catch((error) => {
            console.error(`Google Handwriting recognition error: ${error}`);
          });

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          this.trace.clear();
        }}>Read</button>
      </div>
    );
  }
}
