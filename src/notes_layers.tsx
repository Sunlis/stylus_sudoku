import React from 'react';
import { Button } from '@heroui/react';
import plusIcon from '../static/plus.svg';
import visibleIcon from '../static/visible.svg';
import hiddenIcon from '../static/hidden.svg';
import crosshairIcon from '../static/crosshair.svg';
import paletteIcon from '../static/palette.svg';
import trashIcon from '../static/trash.svg';
import eraserIcon from '../static/eraser.svg';
import { getLayerRowColors } from './colour';

const COLORS = ['#ff0000', '#008000', '#0000ff', '#ffa500'];

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

const LAYER_BUTTON_BASE =
  'rounded-lg border px-3 text-xs shadow-[0_2px_4px_rgba(15,23,42,0.85)]';

const LAYER_BUTTON_NEUTRAL =
  `${LAYER_BUTTON_BASE} border-slate-600 bg-slate-50 hover:bg-slate-100`;
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

const LayerCanvas: React.FC<LayerCanvasProps> = ({
  layer,
  isActive,
  boardRect,
  eraseMode,
  onStrokeWillBegin,
  onBeginStroke,
  onContinueStroke,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [isErasing, setIsErasing] = React.useState(false);

  const resizeCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
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
  }, [boardRect]);

  const redraw = React.useCallback(() => {
    const canvas = canvasRef.current;
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
  }, [boardRect, layer]);

  React.useEffect(() => {
    resizeCanvas();
    redraw();
  }, [resizeCanvas, redraw]);

  const isErasePointer = (event: React.PointerEvent<HTMLCanvasElement>): boolean => {
    if (event.pointerType !== 'pen') {
      return false;
    }
    // For pen pointers, primary (tip) is button 0 (bit 0 in `buttons`).
    // Treat any additional pressed button (side barrel, eraser end, etc.) as erase.
    const nonPrimaryButtonsMask = event.buttons & ~1;
    return nonPrimaryButtonsMask !== 0;
  };

  const getRelativePoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isActive || !boardRect) {
      return;
    }
    event.preventDefault();
    const erase = eraseMode || isErasePointer(event);
    const point = getRelativePoint(event);
    onStrokeWillBegin();
    onBeginStroke(point, erase);
    setIsDrawing(true);
    setIsErasing(erase);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isActive || !boardRect) {
      return;
    }
    event.preventDefault();
    const point = getRelativePoint(event);
    onContinueStroke(point, isErasing);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      return;
    }
    event.preventDefault();
    setIsDrawing(false);
    setIsErasing(false);
  };

  const handlePointerLeave = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      return;
    }
    event.preventDefault();
    setIsDrawing(false);
    setIsErasing(false);
  };

  return (
    <canvas
      ref={canvasRef}
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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    />
  );
};

interface NotesLayersOverlayProps {
  layers: NoteLayer[];
  activeLayerId: number | null;
  eraseMode: boolean;
  onStrokeWillBegin: () => void;
  onBeginStroke: (point: Point, erase: boolean) => void;
  onContinueStroke: (point: Point, erase: boolean) => void;
}

const NotesLayersOverlay: React.FC<NotesLayersOverlayProps> = ({
  layers,
  activeLayerId,
  eraseMode,
  onStrokeWillBegin,
  onBeginStroke,
  onContinueStroke,
}) => {
  const [boardRect, setBoardRect] = React.useState<DOMRect | null>(null);

  React.useEffect(() => {
    const boardEl = document.getElementById('sudoku-board-root');
    if (!boardEl) {
      return;
    }
    const rect = boardEl.getBoundingClientRect();
    setBoardRect(rect);
  }, []);

  React.useEffect(() => {
    const handleResize = () => {
      const boardEl = document.getElementById('sudoku-board-root');
      if (!boardEl) {
        return;
      }
      const rect = boardEl.getBoundingClientRect();
      setBoardRect(rect);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, []);

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
};

interface NotesLayersProps {
  eraseMode: boolean;
  layers: NoteLayer[];
  setLayers: (updater: (prev: NoteLayer[]) => NoteLayer[]) => void;
  onStrokeWillBegin: () => void;
}

export const NotesLayers: React.FC<NotesLayersProps> = ({ eraseMode, layers, setLayers, onStrokeWillBegin }) => {
  const [activeLayerId, setActiveLayerId] = React.useState<number | null>(null);
  const nextIdRef = React.useRef(2);

  React.useEffect(() => {
    const body = document.body;
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
      body.classList.remove('notes-mode');
      body.style.removeProperty('--notes-accent-color');
    }
    return () => {
      body.classList.remove('notes-mode');
      body.style.removeProperty('--notes-accent-color');
    };
  }, [activeLayerId, layers]);

  const addLayer = () => {
    const id = nextIdRef.current++;
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

  const removeLayer = (id: number) => {
    setLayers((prev) => prev.filter((layer) => layer.id !== id));
    setActiveLayerId((prev) => (prev === id ? null : prev));
  };

  const toggleVisibility = (id: number) => {
    setLayers((prev) => prev.map((layer) =>
      layer.id === id ? { ...layer, visible: !layer.visible } : layer,
    ));
  };

  const toggleActive = (id: number) => {
    setActiveLayerId((prev) => (prev === id ? null : id));
  };

  const cycleColor = (id: number) => {
    setLayers((prev) => prev.map((layer) =>
      layer.id === id
        ? { ...layer, colorIndex: (layer.colorIndex + 1) % COLORS.length }
        : layer,
    ));
  };

  const clearLayer = (id: number) => {
    setLayers((prev) => prev.map((layer) =>
      layer.id === id
        ? { ...layer, strokes: [] }
        : layer,
    ));
  };

  const beginStroke = (point: Point, erase: boolean) => {
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

  const continueStroke = (point: Point, erase: boolean) => {
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

  return (
    <>
      <NotesLayersOverlay
        layers={layers}
        activeLayerId={activeLayerId}
        eraseMode={eraseMode}
        onStrokeWillBegin={onStrokeWillBegin}
        onBeginStroke={beginStroke}
        onContinueStroke={continueStroke}
      />
      <div className="flex w-full max-w-3xl flex-col gap-2 rounded-2xl bg-white/90 p-2 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-800">Note layers</span>
          <Button
            size="sm"
            color="primary"
            className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-[0_2px_4px_rgba(15,23,42,0.85)] hover:bg-slate-800"
            onClick={addLayer}
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
                onClick={() => toggleVisibility(layer.id)}
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
                onClick={() => toggleActive(layer.id)}
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
                onClick={() => cycleColor(layer.id)}
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
                onClick={() => clearLayer(layer.id)}
              >
                <img
                  src={eraserIcon}
                  alt=""
                  className="h-5 w-5"
                />
              </Button>
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="light"
                aria-label="Remove layer"
                className={LAYER_BUTTON_REMOVE_CLASS}
                onClick={() => removeLayer(layer.id)}
              >
                <img
                  src={trashIcon}
                  alt=""
                  className="h-5 w-5"
                />
              </Button>
            </div>
          );
        })}
      </div>
    </>
  );
};
