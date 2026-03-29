import React from 'react';
import { getSudoku } from 'sudoku-gen';

import { Board } from '@app/board/board';
import { BoardExport } from '@app/board_export';
import { Controls } from '@app/controls';
import { NotesLayers } from '@app/notes/NotesLayers';
import { Difficulty } from '@app/types';
import { userStorage } from '@app/storage';
import { isRowValid, isColumnValid, isBoxValid, fillCandidates } from '@app/sudoku';
import { CellContents } from '@app/types/board';
import { NoteLayer, NoteText } from '@app/types/notes';
import type { RecognitionOutcome } from '@app/handwriting';

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
  }
  return fillCandidates(out);
};

const recomputeValidity = (board: CellContents[][]): CellContents[][] => {
  const invalid: boolean[][] = Array.from({ length: 9 }, () =>
    Array<boolean>(9).fill(false),
  );

  // Mark invalid rows
  for (let row = 0; row < 9; row++) {
    if (!isRowValid(board, row)) {
      for (let col = 0; col < 9; col++) {
        invalid[row][col] = true;
      }
    }
  }

  // Mark invalid columns
  for (let col = 0; col < 9; col++) {
    if (!isColumnValid(board, col)) {
      for (let row = 0; row < 9; row++) {
        invalid[row][col] = true;
      }
    }
  }

  // Mark invalid boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      if (!isBoxValid(board, boxRow, boxCol)) {
        for (let row = boxRow * 3; row < boxRow * 3 + 3; row++) {
          for (let col = boxCol * 3; col < boxCol * 3 + 3; col++) {
            invalid[row][col] = true;
          }
        }
      }
    }
  }

  return board.map((rowArr, row) =>
    rowArr.map((cell, col) => ({
      ...cell,
      valid: invalid[row][col] ? false : undefined,
    })),
  );
};

function App() {
  const [cells, setCells] = React.useState<CellContents[][]>(() => {
    const stored = userStorage.getBoardState();
    if (stored) {
      return recomputeValidity(stored);
    }
    return recomputeValidity(getNewBoard(userStorage.getDifficulty()));
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
        texts: [],
      },
    ];
  });

  type HistoryEntry = { cells: CellContents[][]; layers: NoteLayer[]; };
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);
  const [eraseMode, setEraseMode] = React.useState(false);
  const [recognitionCandidates, setRecognitionCandidates] = React.useState<{
    local?: string[];
    remote?: string[];
  } | null>(null);
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
      const filteredTexts = layer.texts
        ? layer.texts.filter((t) => !(
          t.x >= minX && t.x <= maxX &&
          t.y >= minY && t.y <= maxY
        ))
        : layer.texts;

      if (filteredStrokes === layer.strokes && filteredTexts === layer.texts) {
        return layer;
      }
      return {
        ...layer,
        strokes: filteredStrokes,
        texts: filteredTexts,
      };
    }));
  };

  const handleDrawCandidates = () => {
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
    const slotWidth = cellWidth / 3;
    const slotHeight = cellHeight / 3;

    const texts: NoteText[] = [];

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = cells[row]?.[col];
        if (!cell || !cell.candidates || cell.candidates.length === 0) {
          continue;
        }

        for (const cand of cell.candidates) {
          const idx = cand - 1;
          if (idx < 0 || idx > 8) {
            continue;
          }
          const gridX = idx % 3;
          const gridY = Math.floor(idx / 3);

          const baseX = col * cellWidth;
          const baseY = row * cellHeight;
          const x = baseX + (gridX + 0.5) * slotWidth;
          const y = baseY + (gridY + 0.5) * slotHeight;

          texts.push({ x, y, text: String(cand) });
        }
      }
    }

    // If there are no candidates, do nothing.
    if (texts.length === 0) {
      return;
    }

    // Capture history so this operation can be undone.
    pushHistory(cells, layers);

    setLayers((prevLayers) => prevLayers.map((layer) => {
      if (layer.name !== 'Candidates') {
        return layer;
      }
      return {
        ...layer,
        strokes: [],
        texts,
      };
    }));
  };

  const handleChangeCell = (row: number, col: number, contents: CellContents) => {
    const nextCells = cells.map((rowArr, rIndex) => {
      if (rIndex !== row) return rowArr;
      return rowArr.map((cell, cIndex) => {
        if (cIndex !== col) return cell;
        return contents;
      });
    });

    // Capture a snapshot of the current board and layers for undo.
    pushHistory(cells, layers);

    setCells(recomputeValidity(nextCells));

    if (contents.user && contents.value !== undefined) {
      clearCandidatesRegion(row, col);
    }
  };

  const handleRecognitionCandidates = (row: number, col: number, outcome: RecognitionOutcome) => {
    // Show a simple debug toast with the raw candidate strings from both paths.
    setRecognitionCandidates({
      local: outcome.localCandidates,
      remote: outcome.remoteCandidates ?? outcome.candidates,
    });

    if (recognitionToastTimeoutRef.current != null) {
      window.clearTimeout(recognitionToastTimeoutRef.current);
    }
    recognitionToastTimeoutRef.current = window.setTimeout(() => {
      setRecognitionCandidates(null);
      recognitionToastTimeoutRef.current = null;
    }, 4000);
  };

  const handleNewPuzzle = (difficulty: Difficulty) => {
    setCells((prevCells) => {
      // Capture current board + layers for undo before resetting.
      pushHistory(prevCells, layers);
      return getNewBoard(difficulty);
    });

    // Clear all note layer contents (strokes/text) while preserving layers.
    setLayers((prevLayers) => prevLayers.map((layer) => ({
      ...layer,
      strokes: [],
      texts: layer.texts ? [] : layer.texts,
    })));
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
            onNewPuzzle={handleNewPuzzle}
            eraseMode={eraseMode}
            onToggleEraseMode={() => setEraseMode((prev) => !prev)}
            onDrawCandidates={handleDrawCandidates}
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
      {recognitionCandidates && (
        <div
          className="fixed inset-x-0 bottom-4 flex justify-center px-4"
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="max-w-sm rounded-xl bg-slate-900/95 px-3 py-2 text-xs text-slate-50 shadow-lg ring-1 ring-slate-700"
            style={{ pointerEvents: 'auto' }}
          >
            <div className="font-semibold mb-1">Recognition candidates</div>
            {recognitionCandidates.local && recognitionCandidates.local.length > 0 && (
              <div className="break-words mb-1">
                <span className="font-semibold">Local: </span>
                <span>{recognitionCandidates.local.join(', ')}</span>
              </div>
            )}
            {recognitionCandidates.remote && recognitionCandidates.remote.length > 0 && (
              <div className="break-words">
                <span className="font-semibold">Remote: </span>
                <span>{recognitionCandidates.remote.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
