import React from 'react';
import { getSudoku } from 'sudoku-gen';

import { Board, BoardProps } from './board';
import { BoardExport } from './board_export';
import { Controls, Difficulty } from './controls';

const getNewBoard = (d: Difficulty) => {
  const out: BoardProps['cells'] = [];
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
      // user: !value,
      user: Math.random() < 0.5
    };
    if (!value) {
      const candidates: number[] = [];
      for (let n = 1; n <= 9; n++) {
        if (Math.random() < 0.4) {
          candidates.push(n);
        }
      }
      out[row][col].candidates = candidates;
    }
  }
  return out;
};

function App() {
  const [cells, setCells] = React.useState<BoardProps['cells']>(() => getNewBoard('medium'));

  return (
    <div>
      <div style={{
          padding: '1rem 0 0 2rem',
          display: 'flex',
          flexDirection: 'row',
          gap: '1rem',
          alignItems: 'center',
        }}>
        
      </div>
      <Board cells={cells} />
      <Controls onNewPuzzle={(difficulty) => {
        setCells(getNewBoard(difficulty))
      }} />
      <BoardExport cells={cells} />
    </div>
  );
}

export default App;
