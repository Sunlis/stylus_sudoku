import React from 'react';
import { getSudoku } from 'sudoku-gen';

import { Board, BoardProps } from './board';

const getNewBoard = () => {
  const out: BoardProps['cells'] = [];
  const {puzzle, solution, difficulty} = getSudoku('expert');
  for (let i = 0; i < 81; i++) {
    const row = Math.floor(i / 9);
    const col = i % 9;
    const value = parseInt(puzzle[i]);
    if (!out[row]) {
      out[row] = [];
    }
    out[row][col] = {
      value: isNaN(value) ? undefined : value,
      user: isNaN(value),
    };
  }
  return out;
};

function App() {
  const [cells, setCells] = React.useState<BoardProps['cells']>(() => getNewBoard());

  return (
    <main style={{ padding: '1.5rem', fontFamily: 'system-ui, sans-serif' }}>
      <button onClick={() => {
        setCells(getNewBoard());
      }}>New puzzle</button>
      <Board cells={cells} />
    </main>
  );
}

export default App;
