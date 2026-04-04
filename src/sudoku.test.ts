import { describe, it, expect } from 'vitest';

import { boxIndex, clearRelatedCandidates, fillCandidates, forEachCell, forEachGroup, isBoardValid, isBoxValid, isColumnValid, isRowValid } from '@app/sudoku';
import { createBoard, type Board, type CellContents } from '@app/types/board';

function emptyCell(): CellContents {
  return { value: undefined } as CellContents;
}

function boardFromValues(values: (number | undefined)[][]): Board {
  return createBoard((row, col) => ({ value: values[row]?.[col] }));
}

describe('boxIndex', () => {
  it('maps corners and edges to correct box indices', () => {
    expect(boxIndex(0, 0)).toBe(0);
    expect(boxIndex(0, 8)).toBe(2);
    expect(boxIndex(8, 0)).toBe(6);
    expect(boxIndex(8, 8)).toBe(8);

    expect(boxIndex(2, 2)).toBe(0);
    expect(boxIndex(2, 3)).toBe(1);
    expect(boxIndex(3, 2)).toBe(3);
    expect(boxIndex(3, 3)).toBe(4);
  });
});

describe('row/column/box validity helpers', () => {
  it('considers a row with unique digits as valid', () => {
    const board = boardFromValues([
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      ...Array.from({ length: 8 }, () => Array(9).fill(undefined)),
    ]);

    expect(isRowValid(board, 0)).toBe(true);
  });

  it('detects duplicate digits in a row', () => {
    const board = boardFromValues([
      [1, 2, 3, 4, 5, 5, 7, 8, 9],
      ...Array.from({ length: 8 }, () => Array(9).fill(undefined)),
    ]);

    expect(isRowValid(board, 0)).toBe(false);
  });

  it('ignores undefined cells when validating a row', () => {
    const board = boardFromValues([
      [1, undefined, 2, undefined, 3, undefined, 4, undefined, 5],
      ...Array.from({ length: 8 }, () => Array(9).fill(undefined)),
    ]);

    expect(isRowValid(board, 0)).toBe(true);
  });

  it('detects duplicate digits in a column', () => {
    const column: (number | undefined)[] = [1, 2, 3, 4, 5, 5, 7, 8, 9];
    const values = Array.from({ length: 9 }, (_, row) =>
      Array.from({ length: 9 }, (_, col) => (col === 0 ? column[row] : undefined)),
    );
    const board = boardFromValues(values);

    expect(isColumnValid(board, 0)).toBe(false);
  });

  it('detects duplicate digits in a box', () => {
    const values = Array.from({ length: 9 }, () => Array(9).fill(undefined));
    values[0][0] = 1;
    values[1][1] = 1; // same 3x3 box as (0,0)

    const board = boardFromValues(values);

    expect(isBoxValid(board, 0, 0)).toBe(false);
  });
});

describe('isBoardValid', () => {
  it('returns true for a valid solved board', () => {
    const values: (number | undefined)[][] = [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ];

    const board = boardFromValues(values);

    expect(isBoardValid(board)).toBe(true);
  });

  it('returns false when a row has a duplicate', () => {
    const values: (number | undefined)[][] = [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ];

    // introduce a duplicate in first row
    values[0][0] = 5;
    values[0][1] = 5;

    const board = boardFromValues(values);

    expect(isBoardValid(board)).toBe(false);
  });

  it('returns false when a column has a duplicate', () => {
    const values: (number | undefined)[][] = [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ];

    // introduce a duplicate in first column
    values[0][0] = 5;
    values[1][0] = 5;

    const board = boardFromValues(values);

    expect(isBoardValid(board)).toBe(false);
  });

  it('returns false when a box has a duplicate', () => {
    const values: (number | undefined)[][] = [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ];

    // introduce a duplicate in top-left box
    values[0][0] = 5;
    values[1][1] = 5;

    const board = boardFromValues(values);

    expect(isBoardValid(board)).toBe(false);
  });

  it('treats undefined cells as empty and valid', () => {
    const values: (number | undefined)[][] = [
      [5, undefined, 4, undefined, 7, undefined, 9, undefined, 2],
      ...Array.from({ length: 8 }, () => Array(9).fill(undefined)),
    ];

    const board = boardFromValues(values);

    expect(isBoardValid(board)).toBe(true);
  });
});

describe('forEachCell', () => {
  it('visits all 81 cells in row-major order', () => {
    const board: Board = createBoard(() => emptyCell());

    const visited: [number, number][] = [];
    forEachCell(board, (_cell, row, col) => {
      visited.push([row, col]);
    });

    expect(visited).toHaveLength(81);
    // check first and last
    expect(visited[0]).toEqual([0, 0]);
    expect(visited[80]).toEqual([8, 8]);
  });
});

describe('forEachGroup', () => {
  it('iterates rows, then columns, then boxes, and stops early when callback returns true', () => {
    const board = boardFromValues(
      Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => r * 9 + c + 1)),
    );

    const groupSizes: number[] = [];
    let count = 0;

    forEachGroup(board, group => {
      groupSizes.push(group.length);
      count++;
      if (count === 5) {
        return true; // stop after 5 groups
      }
      return false;
    });

    expect(groupSizes.every(size => size === 9)).toBe(true);
    expect(count).toBe(5);
  });
});

describe('fillCandidates and clearRelatedCandidates', () => {
  it('initializes candidates for empty cells and removes conflicting digits', () => {
    const values: (number | undefined)[][] = Array.from({ length: 9 }, () => Array(9).fill(undefined));
    values[0][0] = 1; // value in row 0, col 0, box (0,0)
    values[0][1] = 2; // same row
    values[1][0] = 3; // same column and box

    const board = boardFromValues(values);
    const withCandidates = fillCandidates(board);

    // a peer cell in same row should not have 1 or 2 as candidates
    const sameRowCell = withCandidates[0][2];
    expect(sameRowCell.candidates).toBeDefined();
    expect(sameRowCell.candidates).not.toContain(1);
    expect(sameRowCell.candidates).not.toContain(2);

    // a peer cell in same column should not have 1 or 3 as candidates
    const sameColCell = withCandidates[2][0];
    expect(sameColCell.candidates).toBeDefined();
    expect(sameColCell.candidates).not.toContain(1);
    expect(sameColCell.candidates).not.toContain(3);

    // a cell in same box but different row/col should not have 1,2,3
    const sameBoxCell = withCandidates[1][1];
    expect(sameBoxCell.candidates).toBeDefined();
    expect(sameBoxCell.candidates).not.toContain(1);
    expect(sameBoxCell.candidates).not.toContain(2);
    expect(sameBoxCell.candidates).not.toContain(3);

    // a cell in a different box should still have all candidates
    const otherBoxCell = withCandidates[4][4];
    expect(otherBoxCell.candidates).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('clearRelatedCandidates does nothing if the referenced cell has no value', () => {
    const board: Board = createBoard(() => ({ value: undefined, candidates: [1, 2, 3] }));

    const result = clearRelatedCandidates(board, 0, 0);

    expect(result[1][1].candidates).toEqual([1, 2, 3]);
  });
});
