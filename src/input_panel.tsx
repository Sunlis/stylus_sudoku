import React from "react";
import { Input, recognize, SpecialInput, TraceBuilder } from "./handwriting";
import { userStorage } from "./storage";

const PEN_SIZE = 3;

enum InputState {
  IDLE,
  INPUT,
  THINKING,
}

interface Props {
  anchor?: { x: number; y: number; };
  canvasSize: number;
  onNumberRecognized?: (num: number) => void;
  onClearCell?: () => void;
  onStateChange?: (state: InputState) => void;
  eraseMode?: boolean;
}

interface State {
  mouseDown: boolean;
  previousMouse?: { x: number; y: number; };
  inputState: InputState;
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
      inputState: InputState.IDLE,
    };
  }

  componentDidMount(): void {
    this.canvasRef.current?.addEventListener(
      'touchmove',
      this.touchMove.bind(this),
      { passive: false });
  }
  componentWillUnmount(): void {
    this.canvasRef.current?.removeEventListener(
      'touchmove',
      this.touchMove.bind(this));
  }

  private changeState(newState: InputState, extraState: Partial<State> = {}) {
    this.setState({ inputState: newState, ...extraState } as State, () => {
      this.props.onStateChange?.(newState);
    });
  }

  private touchStart(event: TouchEvent) {
    if (this.timeout) {
      window.clearTimeout(this.timeout);
    }
    if (this.props.eraseMode) {
      this.props.onClearCell?.();
      return;
    }
    const canvas = this.canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.closePath();
    ctx.beginPath();
    const pos = this.relativePosition(event as TouchEvent);
    this.changeState(InputState.INPUT, {
      mouseDown: true,
      previousMouse: { x: pos.x, y: pos.y },
    });
    this.trace.beginStroke();
  }

  private touchEnd(event: TouchEvent) {
    if (this.props.eraseMode) {
      return;
    }
    this.changeState(InputState.THINKING,
      {
        mouseDown: false,
        previousMouse: undefined,
      });
    const canvas = this.canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.closePath();
    if (this.timeout) {
      window.clearTimeout(this.timeout);
    }
    this.timeout = window.setTimeout(() => {
      this.recognize();
    }, userStorage.getRecognitionDelay());
  }

  private touchMove(event: TouchEvent) {
    if (this.props.eraseMode) {
      return;
    }
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
    const previous = this.state.previousMouse ?? { x, y };
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
    recognize(
      this.trace.getTrace(),
      { width: canvas.width, height: canvas.height })
      .then((results: Input) => {
        console.log(`Google Handwriting recognized text`, results);
        if (this.props.eraseMode) {
          this.props.onClearCell?.();
        } else if (results.number) {
          this.props.onNumberRecognized?.(results.number);
        } else if (results.special) {
          this.props.onClearCell?.();
        }
      }).catch((error) => {
        console.error(`Google Handwriting recognition error: ${error}`);
      }).finally(() => {
        this.changeState(InputState.IDLE);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      });
    this.trace.clear();
  }

  private relativePosition(event: TouchEvent) {
    const canvas = this.canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    // Calculate normalized position based on rendered size (10vw) and actual canvas resolution (this.props.size)
    const scaleX = this.props.canvasSize / rect.width;
    const scaleY = this.props.canvasSize / rect.height;
    const x = (event.touches[0].clientX - rect.left) * scaleX;
    const y = (event.touches[0].clientY - rect.top) * scaleY;
    return { x, y };
  }

  render() {
    let backgroundColor = 'transparent';
    if (this.state.inputState === InputState.INPUT) {
      backgroundColor = 'rgba(0, 0, 255, 0.1)';
    } else if (this.state.inputState === InputState.THINKING) {
      backgroundColor = 'rgba(255, 150, 0, 0.1)';
    }

    return (
      <canvas
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          margin: 0,
          padding: 0,
          backgroundColor,
        }}
        ref={this.canvasRef}
        onTouchStart={(event) => {
          this.touchStart(event.nativeEvent);
        }}
        onTouchEnd={(event) => {
          this.touchEnd(event.nativeEvent);
        }}
        width={this.props.canvasSize}
        height={this.props.canvasSize} />
    );
  }
}
