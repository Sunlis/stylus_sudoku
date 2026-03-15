import React from 'react';
import { getSudoku } from 'sudoku-gen';

import { Board, CellContents } from './board';
import { BoardExport } from './board_export';
import { Controls } from './controls';
import { Difficulty } from './types';
import { userStorage } from './storage';
import { InputPanel } from './input_panel';

const getNewBoard = (d: Difficulty) => {
  const out: CellContents[][] = [];
  const {puzzle, solution, difficulty} = getSudoku(d);
  for (let i = 0; i < 81; i++) {
    const row = Math.floor(i / 9);
    const col = i % 9;
    let value: number|undefined = parseInt(puzzle[i]);
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
    return getNewBoard(userStorage.getDifficulty());
  });

  return (
    <div>
      <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          alignItems: 'center',
        }}>
        <InputPanel />
        <Controls onNewPuzzle={(difficulty) => {
          setCells(getNewBoard(difficulty))
        }} />
        <Board cells={cells} onChangeCell={(row, col, contents) => {
          cells[row][col] = contents;
          setCells([...cells]);
        }} />
        <BoardExport cells={cells} />
      </div>
    </div>
  );
}

export default App;
