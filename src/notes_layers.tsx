import React from 'react';

const COLORS = ['#ff0000', '#008000', '#0000ff', '#ffa500'];

type Point = {
  x: number;
  y: number;
};

type Stroke = {
  points: Point[];
};

type NoteLayer = {
  id: number;
  name: string;
  colorIndex: number;
  visible: boolean;
  strokes: Stroke[];
};

interface NotesLayersOverlayProps {
  layers: NoteLayer[];
  activeLayerId: number | null;
  onBeginStroke: (point: Point) => void;
  onContinueStroke: (point: Point) => void;
}

const NotesLayersOverlay: React.FC<NotesLayersOverlayProps> = ({
  layers,
  activeLayerId,
  onBeginStroke,
  onContinueStroke,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [lastPoint, setLastPoint] = React.useState<Point | null>(null);
  const [boardRect, setBoardRect] = React.useState<DOMRect | null>(null);

  const resizeCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    const boardEl = document.getElementById('sudoku-board-root');
    if (!canvas || !boardEl) {
      return;
    }
    const rect = boardEl.getBoundingClientRect();
    setBoardRect(rect);
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = rect.height;
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
  }, []);

  const redraw = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
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
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);

    layers.forEach((layer) => {
      if (!layer.visible) {
        return;
      }
      ctx.save();
      ctx.globalAlpha = activeLayerId === layer.id ? 1 : 0.5;
      ctx.strokeStyle = COLORS[layer.colorIndex % COLORS.length];
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      layer.strokes.forEach((stroke) => {
        if (stroke.points.length === 0) {
          return;
        }
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      });
      ctx.restore();
    });
  }, [layers, activeLayerId]);

  React.useEffect(() => {
    resizeCanvas();
    redraw();
  }, [resizeCanvas, redraw]);

  React.useEffect(() => {
    const handleResize = () => {
      resizeCanvas();
      redraw();
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [resizeCanvas, redraw]);

  React.useEffect(() => {
    redraw();
  }, [layers, redraw]);

  const getRelativePoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activeLayerId || !boardRect) {
      return;
    }
    event.preventDefault();
    const point = getRelativePoint(event);
    onBeginStroke(point);
    setIsDrawing(true);
    setLastPoint(point);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !activeLayerId || !boardRect) {
      return;
    }
    event.preventDefault();
    const point = getRelativePoint(event);
    onContinueStroke(point);
    setLastPoint(point);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      return;
    }
    event.preventDefault();
    setIsDrawing(false);
    setLastPoint(null);
  };

  const handlePointerLeave = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      return;
    }
    event.preventDefault();
    setIsDrawing(false);
    setLastPoint(null);
  };

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
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'transparent',
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      />
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

  const beginStroke = (point: Point) => {
    setLayers((prev) => prev.map((layer) => {
      if (layer.id !== activeLayerId) {
        return layer;
      }
      return {
        ...layer,
        strokes: [...layer.strokes, { points: [point] }],
      };
    }));
  };

  const continueStroke = (point: Point) => {
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
