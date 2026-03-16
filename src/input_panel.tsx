import React from "react";
import { recognize, TraceBuilder } from "./handwriting";
import { userStorage } from "./storage";

const PEN_SIZE = 3;

interface Props {
  anchor?: { x: number; y: number};
  size: number;
}

interface State {
  mouseDown: boolean;
  previousMouse?: { x: number; y: number };
}

export class InputPanel extends React.Component<Props, State> {
  canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
  trace: TraceBuilder = new TraceBuilder();
  timeout?: number;

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

  private touchStart(event: TouchEvent) {
    if (this.timeout) {
      window.clearTimeout(this.timeout);
    }
    const canvas = this.canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.closePath();
    ctx.beginPath();
    const pos = this.relativePosition(event as TouchEvent);
    this.setState({ mouseDown: true, previousMouse: { x: pos.x, y: pos.y } });
    this.trace.beginStroke();
  }

  private touchMove(event: TouchEvent) {
    if (!this.state.mouseDown) {
      this.touchStart(event);
    }
    if (this.timeout) {
      window.clearTimeout(this.timeout);
    }
    event.preventDefault();
    const canvas = this.canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const { x, y } = this.relativePosition(event);
    const previous = this.state.previousMouse ?? {x, y};
    ctx.strokeStyle = 'black';
    ctx.lineWidth = PEN_SIZE;
    ctx.moveTo(previous.x, previous.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    this.trace.addPoint(x, y);
    this.setState({ previousMouse: { x, y } });
  }

  private recognize() {
    const canvas = this.canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    recognize(this.trace.getTrace(), { width: canvas.width, height: canvas.height }).then((results) => {
      console.log(`Google Handwriting recognized text: "${results}"`, results);
    }).catch((error) => {
      console.error(`Google Handwriting recognition error: ${error}`);
    });

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.trace.clear();
  }

  private relativePosition(event: TouchEvent) {
    const canvas = this.canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    // Calculate normalized position based on rendered size (10vw) and actual canvas resolution (this.props.size)
    const scaleX = this.props.size / rect.width;
    const scaleY = this.props.size / rect.height;
    const x = (event.touches[0].clientX - rect.left) * scaleX;
    const y = (event.touches[0].clientY - rect.top) * scaleY;
    return { x, y };
  }

  render() {
    return (
      <canvas
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: 'rgba(0, 0, 255, 0.3)',
          width: '20vw',
        }}
        ref={this.canvasRef}
        onTouchStart={(event) => {
          this.touchStart(event.nativeEvent);
        }}
        onTouchEnd={() => {
          this.setState({ mouseDown: false, previousMouse: undefined });
          const canvas = this.canvasRef.current!;
          const ctx = canvas.getContext('2d')!;
          ctx.closePath();
          if (this.timeout) {
            window.clearTimeout(this.timeout);
          }
          this.timeout = window.setTimeout(() => {
            this.recognize();
          }, userStorage.getRecognitionDelay());
        }}
        width={this.props.size}
        height={this.props.size} />
    );
  }
}
