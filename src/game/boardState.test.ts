import { beforeEach, describe, it, expect, vi } from 'vitest';

import { getSudoku } from 'sudoku-gen';

import { getNewBoard, recomputeValidity } from '@app/game/boardState';
import { fillCandidates } from '@app/sudoku';
import type { CellContents } from '@app/types/board';

vi.mock('sudoku-gen', () => ({
  getSudoku: vi.fn(() => ({
    // Simple puzzle: first row has digits 1-9, others empty (dots)
    puzzle: '123456789' + '.'.repeat(72),
  })),
}));

vi.mock('@app/sudoku', async (orig) => {
  const actual = await orig<typeof import('@app/sudoku')>();
  return {
    ...actual,
    fillCandidates: vi.fn(actual.fillCandidates),
  };
});

const makeEmptyBoard = (): CellContents[][] =>
  Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => ({ value: undefined } as CellContents)),
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getNewBoard', () => {
  it('creates a 9x9 board from sudoku-gen puzzle and calls fillCandidates', () => {
    const board = getNewBoard('medium');

    expect(board).toHaveLength(9);
    board.forEach((row) => expect(row).toHaveLength(9));

    // First row should contain numbers 1-9 as given cells
    const firstRowValues = board[0].map((cell) => cell.value);
    expect(firstRowValues).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    // Given cells should not be marked as user cells
    board[0].forEach((cell) => {
      expect(cell.user).toBe(false);
    });

    // Empty cells should be marked as user cells
    for (let r = 1; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        expect(board[r][c].value).toBeUndefined();
        expect(board[r][c].user).toBe(true);
      }
    }

    expect(fillCandidates).toHaveBeenCalledTimes(1);
  });

  it('passes through higher difficulty levels supported by the fork', () => {
    getNewBoard('evil');
    getNewBoard('extreme');

    expect(getSudoku).toHaveBeenNthCalledWith(1, 'evil');
    expect(getSudoku).toHaveBeenNthCalledWith(2, 'extreme');
  });
});

describe('recomputeValidity', () => {
  it('marks all cells as valid when there are no duplicates', () => {
    const board = makeEmptyBoard();
    // Put a single value that does not conflict anywhere else
    board[0][0].value = 1;

    const result = recomputeValidity(board);

    result.forEach((row) => {
      row.forEach((cell) => {
        expect(cell.valid).toBeUndefined();
      });
    });
  });

  it('marks conflicting cells in the same row as invalid', () => {
    const board = makeEmptyBoard();
    board[0][0].value = 1;
    board[0][5].value = 1; // same row conflict

    const result = recomputeValidity(board);

    expect(result[0][0].valid).toBe(false);
    expect(result[0][5].valid).toBe(false);
  });

  it('marks conflicting cells in the same column as invalid', () => {
    const board = makeEmptyBoard();
    board[0][0].value = 2;
    board[5][0].value = 2; // same column conflict

    const result = recomputeValidity(board);

    expect(result[0][0].valid).toBe(false);
    expect(result[5][0].valid).toBe(false);
  });

  it('marks conflicting cells in the same box as invalid', () => {
    const board = makeEmptyBoard();
    board[0][0].value = 3;
    board[1][1].value = 3; // same 3x3 box

    const result = recomputeValidity(board);

    expect(result[0][0].valid).toBe(false);
    expect(result[1][1].valid).toBe(false);
  });
});
