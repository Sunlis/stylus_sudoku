import React from 'react';

import { NoteLayer, Point } from '@app/types/notes';
import { LayerCanvas } from '@app/notes/LayerCanvas';

interface NotesLayersOverlayProps {
  layers: NoteLayer[];
  activeLayerId: number | null;
  eraseMode: boolean;
  highlightDigit?: number;
  isLandscape?: boolean;
  hintVisible?: boolean;
  onStrokeWillBegin: () => void;
  onBeginStroke: (point: Point, erase: boolean) => void;
  onContinueStroke: (point: Point, erase: boolean) => void;
}

interface NotesLayersOverlayState {
  boardRect: DOMRect | null;
}

export class NotesLayersOverlay extends React.Component<NotesLayersOverlayProps, NotesLayersOverlayState> {
  state: NotesLayersOverlayState = {
    boardRect: null,
  };

  private resizeObserver: ResizeObserver | null = null;

  componentDidMount(): void {
    const boardEl = document.getElementById('sudoku-board-root');
    if (!boardEl) {
      return;
    }
    this.updateBoardRect();

    this.resizeObserver = new ResizeObserver(() => this.updateBoardRect());
    this.resizeObserver.observe(boardEl);
    window.addEventListener('scroll', this.updateBoardRect, { passive: true });
    window.addEventListener('resize', this.updateBoardRect, { passive: true });
  }

  componentDidUpdate(prevProps: NotesLayersOverlayProps): void {
    if (prevProps.isLandscape !== this.props.isLandscape ||
      prevProps.hintVisible !== this.props.hintVisible) {
      // Board moved in the layout — position changed without a resize.
      // Use rAF so the browser has committed the new layout before we measure.
      requestAnimationFrame(() => this.updateBoardRect());
    }
  }

  componentWillUnmount(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    window.removeEventListener('scroll', this.updateBoardRect);
    window.removeEventListener('resize', this.updateBoardRect);
  }

  updateBoardRect = (): void => {
    const boardEl = document.getElementById('sudoku-board-root');
    if (!boardEl) {
      return;
    }
    const rect = boardEl.getBoundingClientRect();
    this.setState({ boardRect: rect });
  };

  render(): React.JSX.Element {
    const { layers, activeLayerId, eraseMode, highlightDigit, onStrokeWillBegin, onBeginStroke, onContinueStroke } = this.props;
    const { boardRect } = this.state;

    return (
      <div
        style={{
          position: 'fixed',
          left: boardRect?.left ?? 0,
          top: boardRect?.top ?? 0,
          width: boardRect?.width ?? 0,
          height: boardRect?.height ?? 0,
          touchAction: 'none',
          pointerEvents: activeLayerId && boardRect ? 'auto' : 'none',
          zIndex: 1000,
        }}
        onPointerDown={(event) => {
          // Prevent surrounding page text selection or scrolling while annotating.
          event.preventDefault();
        }}
        onPointerMove={(event) => {
          if (event.buttons !== 0) {
            event.preventDefault();
          }
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
              highlightDigit={highlightDigit}
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
