import React from 'react';
import { Button } from '@heroui/react';

import { Switch } from '@app/components/switch';
import plusIcon from '@static/plus.svg';
import visibleIcon from '@static/visible.svg';
import hiddenIcon from '@static/hidden.svg';
import crosshairIcon from '@static/crosshair.svg';
import paletteIcon from '@static/palette.svg';
import trashIcon from '@static/trash.svg';
import pencilIcon from '@static/pencil.svg';
import eraserIcon from '@static/eraser.svg';

import { getLayerRowColors } from '@app/colour';
import { NoteLayer, Point, Stroke } from '@app/types/notes';
import { NotesLayersOverlay } from '@app/notes/NotesLayersOverlay';

const COLORS = [
  '#ff0000',
  '#008000',
  '#0000ff',
  '#ffa500',
];

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

interface NotesLayersProps {
  eraseMode: boolean;
  onToggleEraseMode: () => void;
  layers: NoteLayer[];
  setLayers: (updater: (prev: NoteLayer[]) => NoteLayer[]) => void;
  onStrokeWillBegin: () => void;
  onLayerActivated?: () => void;
  highlightDigit?: number;
}

interface NotesLayersState {
  activeLayerId: number | null;
}

export class NotesLayers extends React.Component<NotesLayersProps, NotesLayersState> {
  state: NotesLayersState = {
    activeLayerId: null,
  };

  private nextIdRef = Math.max(1, ...this.props.layers.map((l) => l.id)) + 1;

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
        texts: [],
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

  deactivateLayer = (): void => {
    this.setState({ activeLayerId: null });
  };

  toggleActive = (id: number): void => {
    this.setState((prev) => {
      const nextId = prev.activeLayerId === id ? null : id;
      if (nextId !== null) {
        this.props.onLayerActivated?.();
      }
      return { activeLayerId: nextId };
    });
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
        ? { ...layer, strokes: [], texts: [] }
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
          highlightDigit={this.props.highlightDigit}
          onStrokeWillBegin={onStrokeWillBegin}
          onBeginStroke={this.beginStroke}
          onContinueStroke={this.continueStroke}
        />
        <div className="flex w-full max-w-3xl flex-col gap-2 rounded-2xl bg-white/90 p-2 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
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
            <Switch
              isSelected={eraseMode}
              onToggle={this.props.onToggleEraseMode}
              iconOn={eraserIcon}
              iconOff={pencilIcon}
              ariaLabel={eraseMode ? 'Switch to draw mode' : 'Switch to erase mode'}
              title={eraseMode ? 'Eraser on — click to draw' : 'Draw mode — click to erase'}
              trackColorOff='#208757'
              trackColorOn='#882434'
              thumbColorOff='#cfe7d7'
              thumbColorOn='#e1cbcf'
              thumbIconColorOn='#000000'
              thumbIconColorOff='#000000'
            />
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
