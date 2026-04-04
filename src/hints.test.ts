import { describe, expect, it } from 'vitest';

import { cellPosition, getHint, MoveStrategy, STRATEGY_CHECKS } from '@app/hints';
import { createBoard } from '@app/types/board';

// Shorthand: build a board where every cell is solved except the given overrides.
function solvedExcept(
  overrides: Array<{ row: number; col: number; candidates?: number[]; value?: number; }>,
) {
  return createBoard((r, c) => {
    const o = overrides.find((x) => x.row === r && x.col === c);
    return o ?? { value: 5 };
  });
}

describe('cellPosition', () => {
  it('formats row/col as 1-based R/C string', () => {
    expect(cellPosition({ row: 0, col: 0 } as any)).toBe('R1C1');
    expect(cellPosition({ row: 8, col: 8 } as any)).toBe('R9C9');
    expect(cellPosition({ row: 3, col: 5 } as any)).toBe('R4C6');
  });
});

describe('SINGLE_CANDIDATE', () => {
  const check = STRATEGY_CHECKS[MoveStrategy.SINGLE_CANDIDATE];

  it('finds a cell with exactly one candidate', () => {
    const board = solvedExcept([{ row: 2, col: 4, candidates: [7] }]);
    const result = check(board);
    expect(result).not.toBeNull();
    expect(result!.cells).toHaveLength(1);
    expect(result!.cells[0]).toMatchObject({ row: 2, col: 4 });
  });

  it('does not trigger when the cell has more than one candidate', () => {
    const board = solvedExcept([{ row: 0, col: 0, candidates: [1, 2] }]);
    expect(check(board)).toBeNull();
  });
});

describe('LONE_CANDIDATE', () => {
  const check = STRATEGY_CHECKS[MoveStrategy.LONE_CANDIDATE];

  it('finds a candidate that appears in only one cell of a row', () => {
    // candidate 3 appears only in (0,0); candidate 5 appears in both (0,0) and (0,1)
    const board = solvedExcept([
      { row: 0, col: 0, candidates: [3, 5] },
      { row: 0, col: 1, candidates: [5, 6] },
    ]);
    const result = check(board);
    expect(result).not.toBeNull();
    expect(result!.cells[0]).toMatchObject({ row: 0, col: 0 });
    expect(result!.extra).toContain('Row');
  });

  it('does not trigger when every candidate appears in multiple cells', () => {
    // Place cells with [1,2] in both rows and columns so neither candidate is lone in any group
    const board = solvedExcept([
      { row: 0, col: 0, candidates: [1, 2] },
      { row: 0, col: 1, candidates: [1, 2] },
      { row: 1, col: 0, candidates: [1, 2] },
      { row: 1, col: 1, candidates: [1, 2] },
    ]);
    expect(check(board)).toBeNull();
  });
});

describe('NAKED_PAIR', () => {
  const check = STRATEGY_CHECKS[MoveStrategy.NAKED_PAIR];

  it('finds a naked pair when eliminations exist', () => {
    // (0,0) and (0,1) share exactly {1,2}; (0,2) holds candidate 1 so it can be eliminated
    const board = solvedExcept([
      { row: 0, col: 0, candidates: [1, 2] },
      { row: 0, col: 1, candidates: [1, 2] },
      { row: 0, col: 2, candidates: [1, 3] },
    ]);
    const result = check(board);
    expect(result).not.toBeNull();
    const positions = result!.cells.map((c) => `${c.row},${c.col}`).sort();
    expect(positions).toEqual(['0,0', '0,1']);
  });

  it('does not trigger when no eliminations are possible', () => {
    // Naked pair exists but every other cell in the row is solved
    const board = solvedExcept([
      { row: 0, col: 0, candidates: [1, 2] },
      { row: 0, col: 1, candidates: [1, 2] },
    ]);
    expect(check(board)).toBeNull();
  });
});

describe('HIDDEN_PAIR', () => {
  const check = STRATEGY_CHECKS[MoveStrategy.HIDDEN_PAIR];

  it('finds two candidates that appear only in the same two cells', () => {
    // candidates 7 and 8 appear only in (0,0) and (0,1); both cells have extra candidates too
    const board = solvedExcept([
      { row: 0, col: 0, candidates: [3, 7, 8] },
      { row: 0, col: 1, candidates: [4, 7, 8] },
      { row: 0, col: 2, candidates: [3, 4] },
    ]);
    const result = check(board);
    expect(result).not.toBeNull();
    const positions = result!.cells.map((c) => `${c.row},${c.col}`);
    expect(positions).toContain('0,0');
    expect(positions).toContain('0,1');
  });

  it('does not trigger when a candidate appears in more than two cells', () => {
    // candidate 7 leaks into (0,2) so no hidden pair for 7 & 8
    const board = solvedExcept([
      { row: 0, col: 0, candidates: [7, 8] },
      { row: 0, col: 1, candidates: [7, 8] },
      { row: 0, col: 2, candidates: [7, 9] },
    ]);
    expect(check(board)).toBeNull();
  });
});

describe('getHint – integration', () => {
  it('picks SINGLE_CANDIDATE first', () => {
    const board = solvedExcept([{ row: 2, col: 4, candidates: [7] }]);
    const hint = getHint(board);
    expect(hint.strategy).toBe(MoveStrategy.SINGLE_CANDIDATE);
    expect(hint.description).toContain('R3C5');
  });

  it('returns UNKNOWN on a fully solved board', () => {
    const board = createBoard(() => ({ value: 5 }));
    const hint = getHint(board);
    expect(hint.strategy).toBe(MoveStrategy.UNKNOWN);
    expect(hint.result.cells).toHaveLength(0);
    expect(hint.description).toBe('No hints available.');
  });
});
