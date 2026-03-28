import React from 'react';

const COLORS = ['#ff0000', '#008000', '#0000ff', '#ffa500'];

type Point = {
  x: number;
  y: number;
};

type Stroke = {
  points: Point[];
  erase?: boolean;
};

type NoteLayer = {
  id: number;
  name: string;
  colorIndex: number;
  visible: boolean;
  strokes: Stroke[];
};

const STROKE_WIDTH = 2;
const ERASER_WIDTH = 18;

interface LayerCanvasProps {
  layer: NoteLayer;
  isActive: boolean;
  boardRect: DOMRect | null;
  onBeginStroke: (point: Point, erase: boolean) => void;
  onContinueStroke: (point: Point, erase: boolean) => void;
}

const LayerCanvas: React.FC<LayerCanvasProps> = ({
  layer,
  isActive,
  boardRect,
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
    const erase = isErasePointer(event);
    const point = getRelativePoint(event);
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
  onBeginStroke: (point: Point, erase: boolean) => void;
  onContinueStroke: (point: Point, erase: boolean) => void;
}

const NotesLayersOverlay: React.FC<NotesLayersOverlayProps> = ({
  layers,
  activeLayerId,
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
            onBeginStroke={onBeginStroke}
            onContinueStroke={onContinueStroke}
          />
        ) : null
      ))}
    </div>
  );
};

export const NotesLayers: React.FC = () => {
  const [layers, setLayers] = React.useState<NoteLayer[]>(() => {
    return [
      {
        id: 1,
        name: 'Candidates',
        colorIndex: 0,
        visible: true,
        strokes: [],
      },
    ];
  });
  const [activeLayerId, setActiveLayerId] = React.useState<number | null>(null);
  const nextIdRef = React.useRef(2);

  React.useEffect(() => {
    const body = document.body;
    if (activeLayerId != null) {
      body.classList.add('notes-mode');
    } else {
      body.classList.remove('notes-mode');
    }
    return () => {
      body.classList.remove('notes-mode');
    };
  }, [activeLayerId]);

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
        onBeginStroke={beginStroke}
        onContinueStroke={continueStroke}
      />
      <div style={{
        width: '90vw',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        marginTop: '0.5rem',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>Notes layers</span>
          <button onClick={addLayer}>Add layer</button>
        </div>
        {layers.map((layer) => (
          <div
            key={layer.id}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span
              style={{
                minWidth: '6rem',
              }}
            >{layer.name}</span>
            <button
              onClick={() => toggleVisibility(layer.id)}
            >
              {layer.visible ? 'Hide' : 'Show'}
            </button>
            <button
              onClick={() => toggleActive(layer.id)}
            >
              {activeLayerId === layer.id ? 'Deactivate' : 'Activate'}
            </button>
            <button
              style={{
                backgroundColor: COLORS[layer.colorIndex % COLORS.length],
                color: '#ffffff',
              }}
              onClick={() => cycleColor(layer.id)}
            >
              Color
            </button>
            <button onClick={() => removeLayer(layer.id)}>Remove</button>
          </div>
        ))}
      </div>
    </>
  );
};
