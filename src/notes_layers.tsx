import React from 'react';
import { Button } from '@heroui/react';

import plusIcon from '@static/plus.svg';
import visibleIcon from '@static/visible.svg';
import hiddenIcon from '@static/hidden.svg';
import crosshairIcon from '@static/crosshair.svg';
import paletteIcon from '@static/palette.svg';
import trashIcon from '@static/trash.svg';
import eraserIcon from '@static/eraser.svg';

import { getLayerRowColors } from './colour';

const COLORS = [
  '#ff0000',
  '#008000',
  '#0000ff',
  '#ffa500',
];

type Point = {
  x: number;
  y: number;
};

type Stroke = {
  points: Point[];
  erase?: boolean;
};

export type NoteLayer = {
  id: number;
  name: string;
  colorIndex: number;
  visible: boolean;
  strokes: Stroke[];
};

const STROKE_WIDTH = 2;
const ERASER_WIDTH = 18;

const LAYER_ROW_CLASS = 'flex items-center gap-2 rounded-xl px-3 py-2';

const LAYER_ICON_BUTTON_BASE =
  'h-8 w-8 flex items-center justify-center rounded-full border shadow-[0_2px_4px_rgba(15,23,42,0.85)]';

const LAYER_BUTTON_VISIBILITY_CLASS =
  `${LAYER_ICON_BUTTON_BASE} border-slate-600 bg-slate-50 text-slate-700 hover:bg-slate-100`;

const LAYER_BUTTON_ACTIVE_CLASS =
  `${LAYER_ICON_BUTTON_BASE} border-slate-600 bg-slate-50 text-slate-800 hover:bg-slate-100`;

const LAYER_BUTTON_ACTIVE_ON_CLASS =
  `${LAYER_ICON_BUTTON_BASE} border-slate-900 bg-slate-900 text-white hover:bg-slate-900`;

const LAYER_BUTTON_COLOR_CLASS =
  `${LAYER_ICON_BUTTON_BASE} border-slate-600 bg-slate-50 text-slate-800 hover:bg-slate-100`;

const LAYER_BUTTON_REMOVE_CLASS =
  `${LAYER_ICON_BUTTON_BASE} ml-auto border-rose-500 bg-rose-50 text-rose-700 hover:bg-rose-100`;

interface LayerCanvasProps {
  layer: NoteLayer;
  isActive: boolean;
  boardRect: DOMRect | null;
  eraseMode: boolean;
  onStrokeWillBegin: () => void;
  onBeginStroke: (point: Point, erase: boolean) => void;
  onContinueStroke: (point: Point, erase: boolean) => void;
}

interface LayerCanvasState {
  isDrawing: boolean;
  isErasing: boolean;
}

class LayerCanvas extends React.Component<LayerCanvasProps, LayerCanvasState> {
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
    if (prevProps.boardRect !== this.props.boardRect || prevProps.layer !== this.props.layer) {
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
    const { boardRect, layer } = this.props;
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
    ctx.clearRect(0, 0, width, height);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    layer.strokes.forEach((stroke) => {
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

interface NotesLayersOverlayProps {
  layers: NoteLayer[];
  activeLayerId: number | null;
  eraseMode: boolean;
  onStrokeWillBegin: () => void;
  onBeginStroke: (point: Point, erase: boolean) => void;
  onContinueStroke: (point: Point, erase: boolean) => void;
}

interface NotesLayersOverlayState {
  boardRect: DOMRect | null;
}

class NotesLayersOverlay extends React.Component<NotesLayersOverlayProps, NotesLayersOverlayState> {
  state: NotesLayersOverlayState = {
    boardRect: null,
  };

  componentDidMount(): void {
    const boardEl = document.getElementById('sudoku-board-root');
    if (!boardEl) {
      return;
    }
    const rect = boardEl.getBoundingClientRect();
    this.setState({ boardRect: rect });

    window.addEventListener('resize', this.handleResize);
    window.addEventListener('scroll', this.handleResize, { passive: true });
  }

  componentWillUnmount(): void {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('scroll', this.handleResize);
  }

  handleResize = (): void => {
    const boardEl = document.getElementById('sudoku-board-root');
    if (!boardEl) {
      return;
    }
    const rect = boardEl.getBoundingClientRect();
    this.setState({ boardRect: rect });
  };

  render(): JSX.Element {
    const { layers, activeLayerId, eraseMode, onStrokeWillBegin, onBeginStroke, onContinueStroke } = this.props;
    const { boardRect } = this.state;

    return (
      <div
        style={{
          position: 'fixed',
          left: boardRect?.left ?? 0,
          top: boardRect?.top ?? 0,
          width: boardRect?.width ?? 0,
          height: boardRect?.height ?? 0,
          pointerEvents: activeLayerId && boardRect ? 'auto' : 'none',
          zIndex: 1000,
        }}
      >
        {layers.map((layer) => (
          layer.visible ? (
            <LayerCanvas
              key={layer.id}
              layer={layer}
              isActive={activeLayerId === layer.id}
              boardRect={boardRect}
              eraseMode={eraseMode}
              onStrokeWillBegin={onStrokeWillBegin}
              onBeginStroke={onBeginStroke}
              onContinueStroke={onContinueStroke}
            />
          ) : null
        ))}
      </div>
    );
  }
}

interface NotesLayersProps {
  eraseMode: boolean;
  layers: NoteLayer[];
  setLayers: (updater: (prev: NoteLayer[]) => NoteLayer[]) => void;
  onStrokeWillBegin: () => void;
}

interface NotesLayersState {
  activeLayerId: number | null;
}

export class NotesLayers extends React.Component<NotesLayersProps, NotesLayersState> {
  state: NotesLayersState = {
    activeLayerId: null,
  };

  private nextIdRef = 2;

  componentDidMount(): void {
    this.updateBodyForActiveLayer();
  }

  componentDidUpdate(prevProps: NotesLayersProps, prevState: NotesLayersState): void {
    if (prevState.activeLayerId !== this.state.activeLayerId || prevProps.layers !== this.props.layers) {
      this.updateBodyForActiveLayer();
    }
  }

  componentWillUnmount(): void {
    this.clearBodyNotesMode();
  }

  updateBodyForActiveLayer = (): void => {
    const body = document.body;
    const { activeLayerId } = this.state;
    const { layers } = this.props;

    if (activeLayerId != null) {
      body.classList.add('notes-mode');
      const activeLayer = layers.find((layer) => layer.id === activeLayerId);
      if (activeLayer) {
        const { backgroundRgb } = getLayerRowColors(
          COLORS[activeLayer.colorIndex % COLORS.length],
        );
        const accent = `rgba(${backgroundRgb.r}, ${backgroundRgb.g}, ${backgroundRgb.b}, 0.6)`;
        body.style.setProperty('--notes-accent-color', accent);
      }
    } else {
      this.clearBodyNotesMode();
    }
  };

  clearBodyNotesMode = (): void => {
    const body = document.body;
    body.classList.remove('notes-mode');
    body.style.removeProperty('--notes-accent-color');
  };

  addLayer = (): void => {
    const { layers, setLayers } = this.props;
    const id = this.nextIdRef++;
    const nonDefaultIndex = layers.length;
    const name = 'Layer ' + nonDefaultIndex.toString();
    setLayers((prev) => [
      ...prev,
      {
        id,
        name,
        colorIndex: nonDefaultIndex % COLORS.length,
        visible: true,
        strokes: [],
      },
    ]);
  };

  removeLayer = (id: number): void => {
    const { setLayers } = this.props;
    this.setState((prev) => ({ activeLayerId: prev.activeLayerId === id ? null : prev.activeLayerId }));
    setLayers((prev) => prev.filter((layer) => layer.id !== id));
  };

  toggleVisibility = (id: number): void => {
    const { setLayers } = this.props;
    setLayers((prev) => prev.map((layer) =>
      layer.id === id ? { ...layer, visible: !layer.visible } : layer,
    ));
  };

  toggleActive = (id: number): void => {
    this.setState((prev) => ({ activeLayerId: prev.activeLayerId === id ? null : id }));
  };

  cycleColor = (id: number): void => {
    const { setLayers } = this.props;
    setLayers((prev) => prev.map((layer) =>
      layer.id === id
        ? { ...layer, colorIndex: (layer.colorIndex + 1) % COLORS.length }
        : layer,
    ));
  };

  clearLayer = (id: number): void => {
    const { setLayers } = this.props;
    setLayers((prev) => prev.map((layer) =>
      layer.id === id
        ? { ...layer, strokes: [] }
        : layer,
    ));
  };

  beginStroke = (point: Point, erase: boolean): void => {
    const { setLayers } = this.props;
    const { activeLayerId } = this.state;
    setLayers((prev) => prev.map((layer) => {
      if (layer.id !== activeLayerId) {
        return layer;
      }
      return {
        ...layer,
        strokes: [...layer.strokes, { points: [point], erase }],
      };
    }));
  };

  continueStroke = (point: Point, erase: boolean): void => {
    const { setLayers } = this.props;
    const { activeLayerId } = this.state;
    setLayers((prev) => prev.map((layer) => {
      if (layer.id !== activeLayerId) {
        return layer;
      }
      if (layer.strokes.length === 0) {
        return layer;
      }
      const strokes = layer.strokes.slice();
      const lastStroke = strokes[strokes.length - 1];
      const newStroke: Stroke = {
        ...lastStroke,
        points: [...lastStroke.points, point],
      };
      strokes[strokes.length - 1] = newStroke;
      return {
        ...layer,
        strokes,
      };
    }));
  };

  render(): JSX.Element {
    const { eraseMode, layers, onStrokeWillBegin } = this.props;
    const { activeLayerId } = this.state;

    return (
      <>
        <NotesLayersOverlay
          layers={layers}
          activeLayerId={activeLayerId}
          eraseMode={eraseMode}
          onStrokeWillBegin={onStrokeWillBegin}
          onBeginStroke={this.beginStroke}
          onContinueStroke={this.continueStroke}
        />
        <div className="flex w-full max-w-3xl flex-col gap-2 rounded-2xl bg-white/90 p-2 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-800">Note layers</span>
            <Button
              size="sm"
              color="primary"
              className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-[0_2px_4px_rgba(15,23,42,0.85)] hover:bg-slate-800"
              onClick={this.addLayer}
            >
              <span className="flex items-center gap-1">
                <img src={plusIcon} alt="" className="h-3.5 w-3.5" />
                <span>Add layer</span>
              </span>
            </Button>
          </div>
          {layers.map((layer) => {
            const { background, border, labelIsLight, backgroundRgb } = getLayerRowColors(
              COLORS[layer.colorIndex % COLORS.length],
            );

            const isActiveRow = activeLayerId === layer.id;
            const rowBackground = isActiveRow
              ? background
              : `rgba(${backgroundRgb.r}, ${backgroundRgb.g}, ${backgroundRgb.b}, 0.5)`;

            return (
              <div
                key={layer.id}
                style={{
                  backgroundColor: rowBackground,
                  border: `3px solid ${border}`,
                }}
                className={LAYER_ROW_CLASS}
              >
                <span
                  className={`min-w-[6rem] text-sm font-medium ${labelIsLight ? 'text-slate-900' : 'text-white'}`}
                >
                  {layer.name}
                </span>
                <Button
                  isIconOnly
                  size="sm"
                  variant="bordered"
                  aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
                  className={LAYER_BUTTON_VISIBILITY_CLASS}
                  onClick={() => this.toggleVisibility(layer.id)}
                >
                  <img
                    src={layer.visible ? visibleIcon : hiddenIcon}
                    alt=""
                    className="h-5 w-5"
                  />
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="bordered"
                  aria-label={activeLayerId === layer.id ? 'Active layer' : 'Activate layer'}
                  className={isActiveRow ? LAYER_BUTTON_ACTIVE_ON_CLASS : LAYER_BUTTON_ACTIVE_CLASS}
                  onClick={() => this.toggleActive(layer.id)}
                >
                  <img
                    src={crosshairIcon}
                    alt=""
                    className="h-5 w-5"
                    style={isActiveRow ? { filter: 'invert(1)' } : undefined}
                  />
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="bordered"
                  aria-label="Change layer color"
                  className={LAYER_BUTTON_COLOR_CLASS}
                  onClick={() => this.cycleColor(layer.id)}
                >
                  <img
                    src={paletteIcon}
                    alt=""
                    className="h-5 w-5"
                  />
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="bordered"
                  aria-label="Clear layer drawings"
                  className={LAYER_BUTTON_COLOR_CLASS}
                  onClick={() => this.clearLayer(layer.id)}
                >
                  <img
                    src={eraserIcon}
                    alt=""
                    className="h-5 w-5"
                  />
                </Button>
                {layer.name !== 'Candidates' && (
                  <Button
                    isIconOnly
                    size="sm"
                    color="danger"
                    variant="light"
                    aria-label="Remove layer"
                    className={LAYER_BUTTON_REMOVE_CLASS}
                    onClick={() => this.removeLayer(layer.id)}
                  >
                    <img
                      src={trashIcon}
                      alt=""
                      className="h-5 w-5"
                    />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  }
}
