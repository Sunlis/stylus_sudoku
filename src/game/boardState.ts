import { getSudoku } from 'sudoku-gen';

import { Difficulty } from '@app/types';
import { CellContents } from '@app/types/board';
import { fillCandidates, isRowValid, isColumnValid, isBoxValid } from '@app/sudoku';

export const getNewBoard = (d: Difficulty): CellContents[][] => {
  const out: CellContents[][] = [];
  const { puzzle } = getSudoku(d);

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

const isCellPositionValid = (board: CellContents[][], row: number, col: number): boolean => {
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

  return true;
};

export const recomputeValidity = (board: CellContents[][]): CellContents[][] => {
  // Mark any cell whose row, column, or box contains a duplicate as invalid.
  return board.map((rowArr, row) =>
    rowArr.map((cell, col) => {
      const isValid = isCellPositionValid(board, row, col);
      return {
        ...cell,
        valid: isValid ? undefined : false,
      };
    }),
  );
};
