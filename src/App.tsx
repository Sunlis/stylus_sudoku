import React from 'react';
import { getSudoku } from 'sudoku-gen';

import { Board, CellContents } from './board';
import { BoardExport } from './board_export';
import { Controls } from './controls';
import { NotesLayers } from './notes_layers';
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
  const [eraseMode, setEraseMode] = React.useState(false);

  React.useEffect(() => {
    userStorage.setBoardState(cells);
  }, [cells]);

  React.useEffect(() => {
    document.title = 'Stylus Sudoku';
  }, []);

  return (
    <div className="min-h-screen flex items-start justify-center py-6 px-4">
      <div className="flex w-full max-w-3xl flex-col items-stretch gap-4">
        <main className="mt-1 flex flex-col items-center gap-4">
          <div className="rounded-2xl bg-white/90 p-3 shadow-md ring-1 ring-slate-200">
            <Board
              cells={cells}
              eraseMode={eraseMode}
              onChangeCell={(row, col, contents) => {
                cells[row][col] = contents;
                setCells([...cells]);
              }}
            />
          </div>
          <Controls
            onNewPuzzle={(difficulty) => {
              setCells(getNewBoard(difficulty));
            }}
            eraseMode={eraseMode}
            onToggleEraseMode={() => setEraseMode((prev) => !prev)}
          />
          <NotesLayers eraseMode={eraseMode} />
          <div className="w-full rounded-xl bg-slate-950/90 p-3 text-xs text-slate-100 shadow-inner">
            <BoardExport cells={cells} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
