import { getSudoku } from 'sudoku-gen';

import { Difficulty } from '@app/types/difficulty';
import { Board, KillerArea, createBoard } from '@app/types/board';
import { isRowValid, isColumnValid, isBoxValid, isKillerAreaValid, createKillerAreas } from '@app/sudoku';

export const getNewBoard = (d: Difficulty, killerMode: boolean = false): Board => {
  const { puzzle, solution } = getSudoku(d);

  let killerAreas: KillerArea[] = [];
  if (killerMode) {
    const solutionBoard = createBoard((row, col) => ({
      value: parseInt(solution[(row * 9) + col]),
    }));
    killerAreas = createKillerAreas(solutionBoard);
  }

  return createBoard((row, col) => {
    const index = (row * 9) + col;
    let value: number | undefined = parseInt(puzzle[index]);
    value = isNaN(value) ? undefined : value;

    return {
      value: value,
      user: !value,
    };
  }, killerAreas);
};

const isCellPositionValid = (board: Board, row: number, col: number): boolean => {
  const boxRow = Math.floor(row / 3);
  const boxCol = Math.floor(col / 3);

  if (!isRowValid(board, row)) {
    return false;
  }
  if (!isColumnValid(board, col)) {
    return false;
  }
  if (!isBoxValid(board, boxRow, boxCol)) {
    return false;
  }

  for (const area of board.killerAreas) {
    if (area.cells.some((c) => c.row === row && c.col === col)) {
      if (!isKillerAreaValid(board, area)) {
        return false;
      }
      break;
    }
  }

  return true;
};

export const recomputeValidity = (board: Board): Board => {
  // Mark any cell whose row, column, or box contains a duplicate as invalid.
  return createBoard((row, col) => {
    const isValid = isCellPositionValid(board, row, col);
    return {
      ...board.grid[row][col],
      valid: isValid ? undefined : false,
    };
  }, board.killerAreas);
};
