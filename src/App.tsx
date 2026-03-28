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

  return (
    <div className="min-h-screen flex items-start justify-center py-3 px-3">
      <div className="flex w-full max-w-3xl flex-col items-stretch gap-3">
        <main className="mt-0 flex flex-col items-center gap-2">
          <div className="rounded-2xl bg-white p-2 shadow-md ring-1 ring-slate-200">
            <Board
              cells={cells}
              eraseMode={eraseMode}
              onChangeCell={(row, col, contents) => {
                setCells((prevCells) => {
                  pushHistory(prevCells, layers);
                  const next = prevCells.map((rowArr, rIndex) => {
                    if (rIndex !== row) return rowArr;
                    return rowArr.map((cell, cIndex) => {
                      if (cIndex !== col) return cell;
                      return contents;
                    });
                  });
                  return next;
                });
              }}
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
    </div>
  );
}

export default App;
