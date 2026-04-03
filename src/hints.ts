import { hint, type Board as SudokuCoreBoard, type SolvingResult } from 'sudoku-core';

import type { CellContents } from '@app/types/board';

export const toSudokuCoreBoard = (cells: CellContents[][]): SudokuCoreBoard => {
  const board: SudokuCoreBoard = [];

  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      board.push(cells[row]?.[col]?.value ?? null);
    }
  }

  return board;
};

export const getSudokuCoreHint = (cells: CellContents[][]): SolvingResult => {
  return hint(toSudokuCoreBoard(cells));
};

const STRATEGY_MAP: Record<string, string> = {
  "Visual Elimination Strategy": "A cell contains only one candidate.",
  "Open Singles Strategy": "Group contains only one cell.",
  "Single Candidate Strategy": "Group has a candidate that only appears in one cell.",
  "Naked Pair Strategy": "Group contains two cells with the same two candidates.",
  "Hidden Pair Strategy": "Group contains two candidates that only appear in the same two cells.",
  "Pointing Elimination Strategy": "Candidate appears in only one row/column within a box.",
};

export const getHintDescription = (result: SolvingResult): string => {
  const firstStep = result.steps?.[0];
  if (!firstStep) {
    return 'No hints available';
  }
  return STRATEGY_MAP[firstStep.strategy] || "Un-mapped strategy: " + firstStep.strategy;
};
