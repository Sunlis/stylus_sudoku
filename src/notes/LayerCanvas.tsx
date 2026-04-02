import React from 'react';

import { NoteLayer, Point } from '@app/types/notes';

const COLORS = [
  '#ff0000',
  '#008000',
  '#0000ff',
  '#ffa500',
];

const STROKE_WIDTH = 2;
const ERASER_WIDTH = 18;

interface LayerCanvasProps {
  layer: NoteLayer;
  isActive: boolean;
  boardRect: DOMRect | null;
  eraseMode: boolean;
  highlightDigit?: number;
  onStrokeWillBegin: () => void;
  onBeginStroke: (point: Point, erase: boolean) => void;
  onContinueStroke: (point: Point, erase: boolean) => void;
}

interface LayerCanvasState {
  isDrawing: boolean;
  isErasing: boolean;
}

export class LayerCanvas extends React.Component<LayerCanvasProps, LayerCanvasState> {
  canvasRef = React.createRef<HTMLCanvasElement>();

  state: LayerCanvasState = {
    isDrawing: false,
    isErasing: false,
  };

  componentDidMount(): void {
    this.resizeCanvas();
    this.redraw();
  }

  componentDidUpdate(prevProps: LayerCanvasProps): void {
    if (
      prevProps.boardRect !== this.props.boardRect ||
      prevProps.layer !== this.props.layer ||
      prevProps.highlightDigit !== this.props.highlightDigit
    ) {
      this.resizeCanvas();
      this.redraw();
    }
  }

  resizeCanvas = (): void => {
    const canvas = this.canvasRef.current;
    const { boardRect } = this.props;
    if (!canvas || !boardRect) {
      return;
    }
    const dpr = window.devicePixelRatio || 1;
    const width = boardRect.width;
    const height = boardRect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      // In test environments (jsdom), getContext may not be implemented.
      return;
    }
    if (!ctx) {
      return;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  redraw = (): void => {
    const canvas = this.canvasRef.current;
    const { boardRect, layer, highlightDigit } = this.props;
    if (!canvas || !boardRect) {
      return;
    }
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      // In test environments (jsdom), getContext may not be implemented.
      return;
    }
    if (!ctx) {
      return;
    }
    const width = boardRect.width;
    const height = boardRect.height;
    const baseSize = Math.min(width, height) / 30;
    ctx.clearRect(0, 0, width, height);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const strokes = layer.strokes;

    // If a digit is selected for highlighting on the Candidates layer,
    // draw a solid background patch in the 1/9th-cell region *before*
    // text and strokes. Eraser strokes (destination-out) applied later
    // will remove both the glyph and its background without any pixel checks.
    if (highlightDigit && layer.name === 'Candidates' && layer.texts && layer.texts.length > 0) {
      const slotWidth = width / 27;  // 9 cells * 3 slots per row
      const slotHeight = height / 27;
      const radius = Math.min(slotWidth, slotHeight) * 0.5;
      const target = String(highlightDigit);
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      // On e-ink, a medium-dark grey background is more visible than
      // a subtle colour shift.
      ctx.fillStyle = 'rgb(45, 93, 128)';
      for (const t of layer.texts) {
        if (t.text !== target) {
          continue;
        }
        ctx.beginPath();
        ctx.arc(t.x, t.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (layer.texts && layer.texts.length > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      const baseColor = COLORS[layer.colorIndex % COLORS.length];
      const isCandidates = layer.name === 'Candidates';
      const target = highlightDigit != null ? String(highlightDigit) : null;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${baseSize}px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
      for (const t of layer.texts) {
        if (isCandidates && target && t.text === target) {
          ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        } else {
          ctx.fillStyle = baseColor;
        }
        ctx.fillText(t.text, t.x, t.y);
      }
      ctx.restore();
    }

    // Replay strokes in the order they were created so that
    // later draw strokes can appear on top of earlier erase strokes.
    strokes.forEach((stroke) => {
      if (stroke.points.length === 0) {
        return;
      }
      ctx.save();
      if (stroke.erase) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = ERASER_WIDTH;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = COLORS[layer.colorIndex % COLORS.length];
        ctx.lineWidth = STROKE_WIDTH;
      }
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    });

    // The background for highlighted candidates is drawn *before* strokes,
    // so destination-out eraser strokes naturally remove both the glyph
    // and its highlight without requiring any extra bookkeeping.
  };

  isErasePointer = (event: React.PointerEvent<HTMLCanvasElement>): boolean => {
    if (event.pointerType !== 'pen') {
      return false;
    }
    // For pen pointers, primary (tip) is button 0 (bit 0 in `buttons`).
    // Treat any additional pressed button (side barrel, eraser end, etc.) as erase.
    const nonPrimaryButtonsMask = event.buttons & ~1;
    return nonPrimaryButtonsMask !== 0;
  };

  getRelativePoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = this.canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>): void => {
    const { isActive, boardRect, eraseMode, onStrokeWillBegin, onBeginStroke } = this.props;
    if (!isActive || !boardRect) {
      return;
    }
    event.preventDefault();
    const erase = eraseMode || this.isErasePointer(event);
    const point = this.getRelativePoint(event);
    onStrokeWillBegin();
    onBeginStroke(point, erase);
    this.setState({ isDrawing: true, isErasing: erase });
  };

  handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>): void => {
    const { isActive, boardRect, onContinueStroke } = this.props;
    const { isDrawing, isErasing } = this.state;
    if (!isDrawing || !isActive || !boardRect) {
      return;
    }

    // Pointer events from a stylus can fire when the pen is merely near
    // the screen (hovering) with no buttons pressed. Guard against that
    // so we only draw while the pointer is actually down.
    if (event.buttons === 0) {
      return;
    }
    event.preventDefault();
    const point = this.getRelativePoint(event);
    onContinueStroke(point, isErasing);
  };

  handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>): void => {
    const { isDrawing } = this.state;
    if (!isDrawing) {
      return;
    }
    event.preventDefault();
    this.setState({ isDrawing: false, isErasing: false });
  };

  handlePointerLeave = (event: React.PointerEvent<HTMLCanvasElement>): void => {
    const { isDrawing } = this.state;
    if (!isDrawing) {
      return;
    }
    event.preventDefault();
    this.setState({ isDrawing: false, isErasing: false });
  };

  render(): JSX.Element {
    const { isActive } = this.props;

    return (
      <canvas
        ref={this.canvasRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'transparent',
          touchAction: 'none',
          opacity: isActive ? 1 : 0.5,
          pointerEvents: isActive ? 'auto' : 'none',
        }}
        onContextMenu={(event) => {
          event.preventDefault();
        }}
        onPointerDown={this.handlePointerDown}
        onPointerMove={this.handlePointerMove}
        onPointerUp={this.handlePointerUp}
        onPointerLeave={this.handlePointerLeave}
      />
    );
  }
}
