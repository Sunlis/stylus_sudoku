import React from "react";
import Tesseract from "tesseract.js";
import { createWorker } from "tesseract.js";

const PEN_SIZE = 1;

interface Props {}

interface State {
  mouseDown: boolean;
  previousMouse?: { x: number; y: number };
}

export class InputPanel extends React.Component<Props, State> {
  canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
  tesseractWorker?: Tesseract.Worker;

  constructor(props: Props) {
    super(props);
    this.state = {
      mouseDown: false,
      previousMouse: undefined,
    };
    createWorker('eng').then((worker) => {
      worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_CHAR,
        tessedit_char_whitelist: '123456789',
      });
      this.tesseractWorker = worker;
    });
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
    ctx.fillStyle = 'blue';
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = PEN_SIZE;
    ctx.moveTo(this.state.previousMouse?.x || x, this.state.previousMouse?.y || y);
    ctx.lineTo(x, y);
    ctx.stroke();
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
          }}
          onTouchEnd={() => {
            this.setState({ mouseDown: false, previousMouse: undefined });
            const canvas = this.canvasRef.current!;
            const ctx = canvas.getContext('2d')!;
            ctx.closePath();
          }}
          width='100'
          height='100'></canvas>
        <button onClick={async () => {
          const canvas = this.canvasRef.current!;
          const ctx = canvas.getContext('2d')!;
          const rec = await this.tesseractWorker!.recognize(canvas.toDataURL());
          console.log(`Recognized text: "${rec.data.text.trim()}"`);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }}>Read</button>
      </div>
    );
  }
}
