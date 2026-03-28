import React from 'react';
import { getSudoku } from 'sudoku-gen';

import { Board, CellContents } from './board';
import { BoardExport } from './board_export';
import { Controls } from './controls';
import { NotesLayers, NoteLayer } from './notes_layers';
import { Difficulty } from './types';
import { userStorage } from './storage';

const getNewBoard = (d: Difficulty) => {
  const out: CellContents[][] = [];
  const { puzzle, solution, difficulty } = getSudoku(d);
  for (let i = 0; i < 81; i++) {
    const row = Math.floor(i / 9);
    const col = i % 9;
    let value: number | undefined = parseInt(puzzle[i]);
    value = isNaN(value) ? undefined : value;
    if (!out[row]) {
      out[row] = [];
    }
    out[row][col] = {
      value: value,
      user: !value,
    };
    if (!value) {
      const candidates: number[] = [];
      out[row][col].candidates = candidates;
    }
  }
  return out;
};

function App() {
  const [cells, setCells] = React.useState<CellContents[][]>(() => {
    const stored = userStorage.getBoardState();
    if (stored) {
      return stored;
    }
    return getNewBoard(userStorage.getDifficulty());
  });
  const [layers, setLayers] = React.useState<NoteLayer[]>(() => {
    const stored = userStorage.getNotesLayers<NoteLayer[]>();
    if (stored && Array.isArray(stored)) {
      return stored.map((layer) => ({ ...layer }));
    }
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

  type HistoryEntry = { cells: CellContents[][]; layers: NoteLayer[]; };
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);
  const [eraseMode, setEraseMode] = React.useState(false);
  const [recognitionCandidates, setRecognitionCandidates] = React.useState<string[] | null>(null);
  const recognitionToastTimeoutRef = React.useRef<number | null>(null);

  const pushHistory = React.useCallback((snapshotCells: CellContents[][], snapshotLayers: NoteLayer[]) => {
    const MAX_HISTORY = 100;
    setHistory((prev) => {
      const updated = [...prev, { cells: snapshotCells, layers: snapshotLayers }];
      if (updated.length > MAX_HISTORY) {
        updated.shift();
      }
      return updated;
    });
  }, []);

  React.useEffect(() => {
    userStorage.setBoardState(cells);
  }, [cells]);

  React.useEffect(() => {
    userStorage.setNotesLayers(layers);
  }, [layers]);

  React.useEffect(() => {
    document.title = 'Stylus Sudoku';
  }, []);

  const clearCandidatesRegion = (row: number, col: number) => {
    const boardEl = document.getElementById('sudoku-board-root');
    if (!boardEl) {
      return;
    }
    const rect = boardEl.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }

    const cellWidth = rect.width / 9;
    const cellHeight = rect.height / 9;

    const minX = col * cellWidth;
    const maxX = (col + 1) * cellWidth;
    const minY = row * cellHeight;
    const maxY = (row + 1) * cellHeight;

    setLayers((prevLayers) => prevLayers.map((layer) => {
      if (layer.name !== 'Candidates') {
        return layer;
      }
      const filteredStrokes = layer.strokes.filter((stroke) => {
        return !stroke.points.some((point) => (
          point.x >= minX && point.x <= maxX &&
          point.y >= minY && point.y <= maxY
        ));
      });
      if (filteredStrokes === layer.strokes) {
        return layer;
      }
      return {
        ...layer,
        strokes: filteredStrokes,
      };
    }));
  };

  const handleChangeCell = (row: number, col: number, contents: CellContents) => {
    // Capture a snapshot of the current board and layers for undo.
    pushHistory(cells, layers);

    setCells((prevCells) => {
      return prevCells.map((rowArr, rIndex) => {
        if (rIndex !== row) return rowArr;
        return rowArr.map((cell, cIndex) => {
          if (cIndex !== col) return cell;
          return contents;
        });
      });
    });

    if (contents.user && contents.value !== undefined) {
      clearCandidatesRegion(row, col);
    }
  };

  const handleRecognitionCandidates = (row: number, col: number, candidates: string[]) => {
    // Show a simple debug toast with the raw candidate strings.
    setRecognitionCandidates(candidates);

    if (recognitionToastTimeoutRef.current != null) {
      window.clearTimeout(recognitionToastTimeoutRef.current);
    }
    recognitionToastTimeoutRef.current = window.setTimeout(() => {
      setRecognitionCandidates(null);
      recognitionToastTimeoutRef.current = null;
    }, 4000);
  };

  return (
    <div className="min-h-screen flex items-start justify-center py-3 px-3">
      <div className="flex w-full max-w-3xl flex-col items-stretch gap-3">
        <main className="mt-0 flex flex-col items-center gap-2">
          <div className="rounded-2xl bg-white p-2 shadow-md ring-1 ring-slate-200">
            <Board
              cells={cells}
              eraseMode={eraseMode}
              onChangeCell={handleChangeCell}
              onRecognitionCandidates={handleRecognitionCandidates}
            />
          </div>
          <Controls
            onNewPuzzle={(difficulty) => {
              setCells((prevCells) => {
                pushHistory(prevCells, layers);
                return getNewBoard(difficulty);
              });
            }}
            eraseMode={eraseMode}
            onToggleEraseMode={() => setEraseMode((prev) => !prev)}
            onUndo={() => {
              setHistory((prevHistory) => {
                if (prevHistory.length === 0) {
                  return prevHistory;
                }
                const nextHistory = [...prevHistory];
                const previous = nextHistory.pop()!;
                setCells(previous.cells);
                setLayers(previous.layers);
                return nextHistory;
              });
            }}
            canUndo={history.length > 0}
          />
          <NotesLayers
            eraseMode={eraseMode}
            layers={layers}
            setLayers={(updater) => setLayers((prev) => updater(prev))}
            onStrokeWillBegin={() => {
              pushHistory(cells, layers);
            }}
          />
          <div className="w-full rounded-2xl bg-white/90 p-2 text-xs text-slate-800 shadow-sm ring-1 ring-slate-200">
            <BoardExport cells={cells} />
          </div>
        </main>
      </div>
      {recognitionCandidates && recognitionCandidates.length > 0 && (
        <div
          className="fixed inset-x-0 bottom-4 flex justify-center px-4"
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="max-w-sm rounded-xl bg-slate-900/95 px-3 py-2 text-xs text-slate-50 shadow-lg ring-1 ring-slate-700"
            style={{ pointerEvents: 'auto' }}
          >
            <div className="font-semibold mb-1">Recognition candidates</div>
            <div className="break-words">
              {recognitionCandidates.join(', ')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
