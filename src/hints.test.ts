import { describe, expect, it, vi } from 'vitest';

import { getSudokuCoreHint, toSudokuCoreBoard } from '@app/hints';
import type { CellContents } from '@app/types/board';

const { hintMock } = vi.hoisted(() => ({
  hintMock: vi.fn(() => ({
    solved: false,
    board: Array(81).fill(null),
    steps: [],
  })),
}));

vi.mock('sudoku-core', () => ({
  hint: hintMock,
}));

describe('toSudokuCoreBoard', () => {
  it('flattens our board into sudoku-core row-major format', () => {
    const cells = Array.from({ length: 9 }, () =>
      Array.from({ length: 9 }, () => ({ value: undefined } as CellContents)),
    );

    cells[0][0] = { value: 5 };
    cells[0][1] = { value: undefined };
    cells[1][0] = { value: 7 };
    cells[8][8] = { value: 9 };

    const board = toSudokuCoreBoard(cells);

    expect(board).toHaveLength(81);
    expect(board[0]).toBe(5);
    expect(board[1]).toBeNull();
    expect(board[9]).toBe(7);
    expect(board[80]).toBe(9);
  });
});

describe('getSudokuCoreHint', () => {
  it('passes the converted board to sudoku-core hint', () => {
    const cells = Array.from({ length: 9 }, () =>
      Array.from({ length: 9 }, () => ({ value: undefined } as CellContents)),
    );
    cells[0][0] = { value: 4 };

    const result = getSudokuCoreHint(cells);

    expect(hintMock).toHaveBeenCalledWith(
      expect.arrayContaining([4]),
    );
    expect(result).toEqual({
      solved: false,
      board: Array(81).fill(null),
      steps: [],
    });
  });
});
