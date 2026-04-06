import { getSudoku } from 'sudoku-gen';

import { Difficulty } from '@app/types/difficulty';
import { Board, KillerArea, createBoard } from '@app/types/board';
import { isRowValid, isColumnValid, isBoxValid, isKillerAreaValid, createKillerAreas } from '@app/sudoku';

// Fraction of pre-filled clues to remove when killer mode is active.
const KILLER_REMOVAL_RATE: Record<Difficulty, number> = {
  [Difficulty.Easy]: 0.3,
  [Difficulty.Medium]: 0.45,
  [Difficulty.Hard]: 0.6,
  [Difficulty.Expert]: 0.75,
};

export const getNewBoard = (d: Difficulty, killerMode: boolean = false): Board => {
  const { puzzle, solution } = getSudoku(d);

  let killerAreas: KillerArea[] = [];
  if (killerMode) {
    const solutionBoard = createBoard((row, col) => ({
      value: parseInt(solution[(row * 9) + col]),
    }));
    killerAreas = createKillerAreas(solutionBoard);
  }

  // Collect the indices of pre-filled clue cells.
  const clueIndices: number[] = [];
  for (let i = 0; i < 81; i++) {
    if (!isNaN(parseInt(puzzle[i]))) {
      clueIndices.push(i);
    }
  }

  // In killer mode, randomly blank out a difficulty-scaled fraction of clues.
  const removedIndices = new Set<number>();
  if (killerMode) {
    const rate = KILLER_REMOVAL_RATE[d];
    const removeCount = Math.round(clueIndices.length * rate);
    const shuffled = clueIndices.slice().sort(() => Math.random() - 0.5);
    for (let i = 0; i < removeCount; i++) {
      removedIndices.add(shuffled[i]);
    }
  }

  return createBoard((row, col) => {
    const index = (row * 9) + col;
    let value: number | undefined = parseInt(puzzle[index]);
    value = isNaN(value) ? undefined : value;

    if (removedIndices.has(index)) {
      value = undefined;
    }

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
