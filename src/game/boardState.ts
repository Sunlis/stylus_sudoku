import { getSudoku } from 'sudoku-gen';

import { Difficulty } from '@app/types';
import { Board, createBoard } from '@app/types/board';
import { isRowValid, isColumnValid, isBoxValid } from '@app/sudoku';

export const getNewBoard = (d: Difficulty): Board => {
  const { puzzle } = getSudoku(d);

  return createBoard((row, col) => {
    const index = (row * 9) + col;
    let value: number | undefined = parseInt(puzzle[index]);
    value = isNaN(value) ? undefined : value;

    return {
      value: value,
      user: !value,
    };
  });
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

  return true;
};

export const recomputeValidity = (board: Board): Board => {
  // Mark any cell whose row, column, or box contains a duplicate as invalid.
  return createBoard((row, col) => {
    const isValid = isCellPositionValid(board, row, col);
    return {
      ...board[row][col],
      valid: isValid ? undefined : false,
    };
  });
};
