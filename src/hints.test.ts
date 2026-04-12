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

  it('does not trigger when the two paired cells contain only those two candidates (naked pair, not hidden)', () => {
    // Column has 4 unsolved cells; two share [2,7] and two share [3,9].
    // Candidates 2 and 7 appear in exactly the same two cells, but those cells have no
    // extra candidates to eliminate — this is a naked pair, not a hidden pair.
    const board = solvedExcept([
      { row: 0, col: 0, candidates: [2, 7] },
      { row: 1, col: 0, candidates: [2, 7] },
      { row: 2, col: 0, candidates: [3, 9] },
      { row: 3, col: 0, candidates: [3, 9] },
    ]);
    expect(check(board)).toBeNull();
  });
});

describe('NAKED_TRIPLE', () => {
  const check = STRATEGY_CHECKS[MoveStrategy.NAKED_TRIPLE];

  it('finds a naked triple when eliminations exist', () => {
    // (0,0){1,2}, (0,1){2,3}, (0,2){1,3} — union is {1,2,3}
    // (0,3){1,4} can have candidate 1 eliminated
    const board = solvedExcept([
      { row: 0, col: 0, candidates: [1, 2] },
      { row: 0, col: 1, candidates: [2, 3] },
      { row: 0, col: 2, candidates: [1, 3] },
      { row: 0, col: 3, candidates: [1, 4] },
    ]);
    const result = check(board);
    expect(result).not.toBeNull();
    const positions = result!.cells.map((c) => `${c.row},${c.col}`).sort();
    expect(positions).toEqual(['0,0', '0,1', '0,2']);
  });

  it('does not trigger when no eliminations are possible', () => {
    // Triple exists but no other unsolved cell in the group holds any of the three candidates
    const board = solvedExcept([
      { row: 0, col: 0, candidates: [1, 2] },
      { row: 0, col: 1, candidates: [2, 3] },
      { row: 0, col: 2, candidates: [1, 3] },
    ]);
    expect(check(board)).toBeNull();
  });

  it('does not trigger when the union spans more than three digits', () => {
    // Each pair of cells covers completely different candidates – no triple can have union ≤ 3
    const board = solvedExcept([
      { row: 0, col: 0, candidates: [1, 2] },
      { row: 0, col: 1, candidates: [3, 4] },
      { row: 0, col: 2, candidates: [5, 6] },
      { row: 0, col: 3, candidates: [7, 8] },
    ]);
    expect(check(board)).toBeNull();
  });
});

describe('HIDDEN_TRIPLE', () => {
  const check = STRATEGY_CHECKS[MoveStrategy.HIDDEN_TRIPLE];

  it('finds a hidden triple when the three candidates are confined to three cells', () => {
    // Candidates 6, 7, 8 appear only in (0,0), (0,1), (0,2); each cell has one extra candidate
    // Extra candidates (1,2,3) each appear in only one cell so they don't form accidental triples
    const board = solvedExcept([
      { row: 0, col: 0, candidates: [1, 6, 7] },
      { row: 0, col: 1, candidates: [2, 6, 8] },
      { row: 0, col: 2, candidates: [3, 7, 8] },
    ]);
    const result = check(board);
    expect(result).not.toBeNull();
    const positions = result!.cells.map((c) => `${c.row},${c.col}`).sort();
    expect(positions).toEqual(['0,0', '0,1', '0,2']);
  });

  it('does not trigger when a candidate leaks into a fourth cell', () => {
    // candidate 6 now leaks into row 0 via (0,3) and into box 0 via (1,0),
    // breaking the {6,7,8} confined triple in both the row and box groups
    const board = solvedExcept([
      { row: 0, col: 0, candidates: [1, 6, 7] },
      { row: 0, col: 1, candidates: [2, 6, 8] },
      { row: 0, col: 2, candidates: [3, 7, 8] },
      { row: 0, col: 3, candidates: [4, 6] }, // leaks 6 into row 0
      { row: 1, col: 0, candidates: [5, 6] }, // leaks 6 into box 0
    ]);
    expect(check(board)).toBeNull();
  });

  it('does not trigger when the three cells have no extra candidates to eliminate', () => {
    // Candidates 6, 7, 8 confined to exactly (0,0){6,7}, (0,1){6,8}, (0,2){7,8} — pure naked triple, no extras
    const board = solvedExcept([
      { row: 0, col: 0, candidates: [6, 7] },
      { row: 0, col: 1, candidates: [6, 8] },
      { row: 0, col: 2, candidates: [7, 8] },
    ]);
    expect(check(board)).toBeNull();
  });
});

describe('LOCKED_CANDIDATES', () => {
  const check = STRATEGY_CHECKS[MoveStrategy.LOCKED_CANDIDATES];

  it('Type 1 (pointing pair): candidate confined to one row within a box eliminates from rest of row', () => {
    // Candidate 5 in box (0,0) only appears in row 0 (cols 0 and 1).
    // Cell (0,6) also has candidate 5 — outside the box in the same row → should be eliminated.
    const board = solvedExcept([
      { row: 0, col: 0, candidates: [3, 5] },
      { row: 0, col: 1, candidates: [5, 7] },
      { row: 1, col: 0, candidates: [3, 7] }, // candidate 5 absent from rest of box
      { row: 0, col: 6, candidates: [5, 9] }, // victim outside box in row 0
    ]);
    const result = check(board);
    expect(result).not.toBeNull();
    expect(result!.extra).toContain('Row 1');
    expect(result!.extra).toContain('outside Box 1');
  });

  it('Type 1 (pointing pair): candidate confined to one column within a box eliminates from rest of column', () => {
    // Candidate 4 in box (0,0) only appears in col 2 (rows 0 and 1).
    // Cell (6,2) also has candidate 4 — outside the box in the same column → should be eliminated.
    const board = solvedExcept([
      { row: 0, col: 2, candidates: [4, 6] },
      { row: 1, col: 2, candidates: [4, 8] },
      { row: 0, col: 0, candidates: [6, 8] }, // candidate 4 absent from rest of box row
      { row: 6, col: 2, candidates: [4, 9] }, // victim outside box in col 2
    ]);
    const result = check(board);
    expect(result).not.toBeNull();
    expect(result!.extra).toContain('Column 3');
    expect(result!.extra).toContain('outside Box 1');
  });

  it('Type 2 (box-line reduction): candidate confined to one box within a row eliminates from rest of box', () => {
    // Candidate 6 in row 3 only appears in box (1,0) (cols 0–2).
    // Cell (4,1) also has candidate 6 — in the same box but different row → should be eliminated.
    const board = solvedExcept([
      { row: 3, col: 0, candidates: [6, 9] },
      { row: 3, col: 1, candidates: [2, 6] },
      { row: 4, col: 1, candidates: [6, 7] }, // victim: same box, different row
    ]);
    const result = check(board);
    expect(result).not.toBeNull();
    expect(result!.extra).toContain('Box 4');
    expect(result!.extra).toContain('Row 4');
  });

  it('does not trigger when no eliminations are possible', () => {
    // Candidate 3 in box (0,0) is in two different rows AND two different cols — not locked.
    const board = solvedExcept([
      { row: 0, col: 0, candidates: [3, 5] },
      { row: 1, col: 1, candidates: [3, 7] },
    ]);
    expect(check(board)).toBeNull();
  });
});

describe('Y_WING', () => {
  const check = STRATEGY_CHECKS[MoveStrategy.Y_WING];

  it('finds a y-wing and identifies pivot and two pincers', () => {
    // Pivot (0,0){1,2}; pinB (0,5){1,3} shares row 0; pinC (5,0){2,3} shares col 0
    // Victim (5,5){3,4} sees pinB via col 5 and pinC via row 5
    const board = solvedExcept([
      { row: 0, col: 0, candidates: [1, 2] },
      { row: 0, col: 5, candidates: [1, 3] },
      { row: 5, col: 0, candidates: [2, 3] },
      { row: 5, col: 5, candidates: [3, 4] },
    ]);
    const result = check(board);
    expect(result).not.toBeNull();
    const positions = result!.cells.map((c) => `${c.row},${c.col}`).sort();
    // Returns pivot + the two pincers
    expect(positions).toContain('0,0');
    expect(positions).toContain('0,5');
    expect(positions).toContain('5,0');
    // extra identifies the victim
    expect(result!.extra).toContain('R6C6');
  });

  it('does not trigger when pincers see each other (same row)', () => {
    // R4C2=[2,4] pivot, R4C4=[2,9] pinB, R4C5=[4,9] pinC — all in row 4
    // pinB and pinC share the same row AND box, so they see each other → degenerate case.
    // A potential victim (R5C4=[9,5]) exists in the shared box, but no Y-wing should fire.
    const board = solvedExcept([
      { row: 3, col: 1, candidates: [2, 4] }, // R4C2 pivot
      { row: 3, col: 3, candidates: [2, 9] }, // R4C4 pinB
      { row: 3, col: 4, candidates: [4, 9] }, // R4C5 pinC
      { row: 4, col: 3, candidates: [5, 9] }, // potential victim in shared box
    ]);
    expect(check(board)).toBeNull();
  });

  it('does not trigger when pincers share a box but not a row (still see each other)', () => {
    // All three in the same box — pincers see each other via box
    const board = solvedExcept([
      { row: 0, col: 0, candidates: [1, 2] }, // pivot
      { row: 0, col: 1, candidates: [1, 3] }, // pinB — sees pivot (row), sees pinC (box)
      { row: 1, col: 0, candidates: [2, 3] }, // pinC — sees pivot (col), sees pinB (box)
      { row: 1, col: 1, candidates: [3, 4] }, // potential victim in same box
    ]);
    expect(check(board)).toBeNull();
  });

  it('does not trigger when there is no victim cell that sees both pincers', () => {
    // Same pivot and pincers but no unsolved cell with candidate 3 that sees both
    const board = solvedExcept([
      { row: 0, col: 0, candidates: [1, 2] },
      { row: 0, col: 5, candidates: [1, 3] },
      { row: 5, col: 0, candidates: [2, 3] },
    ]);
    expect(check(board)).toBeNull();
  });

  it('does not trigger when pincers do not share a common third candidate', () => {
    // pinB has {1,3}, pinC has {2,4} — no shared r
    const board = solvedExcept([
      { row: 0, col: 0, candidates: [1, 2] },
      { row: 0, col: 5, candidates: [1, 3] },
      { row: 5, col: 0, candidates: [2, 4] },
      { row: 5, col: 5, candidates: [3, 4] },
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
    expect(hint.description).toBe('UNKNOWN');
  });
});
