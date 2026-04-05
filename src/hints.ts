import { forEachCell, forEachGroup, GroupType } from './sudoku';
import { Board, Cell } from './types/board';

export enum MoveStrategy {
  UNKNOWN,
  SINGLE_CANDIDATE, // A cell contains only one candidate
  LONE_CANDIDATE, // A candidate is only present in one cell in a group
  NAKED_PAIR, // A pair of cells in a group have only the same two candidates
  HIDDEN_PAIR, // A pair of candidates in a group are only present in the same two cells
  NAKED_TRIPLE, // Three cells in a group whose candidates are all subsets of the same three digits
  HIDDEN_TRIPLE, // Three candidates in a group that are only present in the same three cells
  LOCKED_CANDIDATES, // A candidate in a box is confined to one row/col (or vice-versa), allowing eliminations
  Y_WING, // A pivot cell with two candidates links two pincers, eliminating a shared candidate
}

interface StrategyResult {
  cells: Cell[];
  extra?: string;
}

interface Hint {
  strategy: MoveStrategy;
  description: string;
  result: StrategyResult;
}

const STRATEGIES: MoveStrategy[] = [
  MoveStrategy.SINGLE_CANDIDATE,
  MoveStrategy.LONE_CANDIDATE,
  MoveStrategy.NAKED_PAIR,
  MoveStrategy.HIDDEN_PAIR,
  MoveStrategy.NAKED_TRIPLE,
  MoveStrategy.HIDDEN_TRIPLE,
  MoveStrategy.LOCKED_CANDIDATES,
  MoveStrategy.Y_WING,
  MoveStrategy.UNKNOWN,
];

const STRATEGY_MAP: Record<MoveStrategy, string> = {
  [MoveStrategy.UNKNOWN]: "No hints available.",
  [MoveStrategy.SINGLE_CANDIDATE]: "A cell contains only one candidate.",
  [MoveStrategy.LONE_CANDIDATE]: "Group has only one valid position for a candidate.",
  [MoveStrategy.NAKED_PAIR]: "A pair of cells in a group have only the same two candidates.",
  [MoveStrategy.HIDDEN_PAIR]: "A pair of candidates in a group are only present in the same two cells.",
  [MoveStrategy.NAKED_TRIPLE]: "Three cells in a group share only the same three candidates.",
  [MoveStrategy.HIDDEN_TRIPLE]: "Three candidates in a group are confined to the same three cells.",
  [MoveStrategy.LOCKED_CANDIDATES]: "A candidate is locked within a box's row or column.",
  [MoveStrategy.Y_WING]: "A pivot cell with two pincers allows elimination of a shared candidate.",
};

const GROUP_NAME = {
  [GroupType.ROW]: "Row",
  [GroupType.COLUMN]: "Column",
  [GroupType.BOX]: "Box",
};

// Returns true if two cells can see each other (same row, column, or box).
const seesCell = (a: Cell, b: Cell): boolean =>
  a.row === b.row ||
  a.col === b.col ||
  (Math.floor(a.row / 3) === Math.floor(b.row / 3) && Math.floor(a.col / 3) === Math.floor(b.col / 3));

export const STRATEGY_CHECKS: Record<MoveStrategy, (cells: Board) => null | StrategyResult> = {
  // Check for any cell that has only one candidate.
  [MoveStrategy.SINGLE_CANDIDATE]: (cells) => {
    return forEachCell(cells, (cell) => {
      if (cell.value === undefined && cell.candidates?.length === 1) {
        return { cells: [cell] };
      }
    }) || null;
  },
  // Check for any group that has only one cell with a given candidate.
  [MoveStrategy.LONE_CANDIDATE]: (cells) => {
    return forEachGroup(cells, (group, type, index) => {
      const candidatesMap: Record<number, Cell[]> = {};
      for (const cell of group) {
        if (cell.value !== undefined) {
          continue;
        }
        for (const candidate of cell.candidates ?? []) {
          if (!candidatesMap[candidate]) {
            candidatesMap[candidate] = [];
          }
          candidatesMap[candidate].push(cell);
        }
      }
      for (const candidate in candidatesMap) {
        if (candidatesMap[candidate].length === 1) {
          return {
            cells: candidatesMap[candidate],
            extra: `${GROUP_NAME[type]} ${index + 1}`,
          };
        }
      }
    }) || null;
  },
  // Check for any pair of cells in a group that have only the same two candidates,
  // where at least one other cell in the group contains one of those candidates.
  [MoveStrategy.NAKED_PAIR]: (cells) => {
    return forEachGroup(cells, (group, type, index) => {
      const pairCells = group.filter(
        (cell) => cell.value === undefined && cell.candidates?.length === 2,
      );
      for (let i = 0; i < pairCells.length; i++) {
        for (let j = i + 1; j < pairCells.length; j++) {
          const a = pairCells[i].candidates!;
          const b = pairCells[j].candidates!;
          if (a[0] !== b[0] || a[1] !== b[1]) {
            continue;
          }
          const [c1, c2] = a;
          const hasElimination = group.some(
            (cell) =>
              cell !== pairCells[i] &&
              cell !== pairCells[j] &&
              cell.value === undefined &&
              (cell.candidates?.includes(c1) || cell.candidates?.includes(c2)),
          );
          if (hasElimination) {
            return {
              cells: [pairCells[i], pairCells[j]],
              extra: `${GROUP_NAME[type]} ${index + 1}`
            };
          }
        }
      }
    }) || null;
  },
  // Check for any pair of candidates in a group that are only present in the same two cells.
  [MoveStrategy.HIDDEN_PAIR]: (cells) => {
    return forEachGroup(cells, (group, type, index) => {
      const candidatesMap: Record<number, Cell[]> = {};
      for (const cell of group) {
        if (cell.value !== undefined) continue;
        for (const candidate of cell.candidates ?? []) {
          if (!candidatesMap[candidate]) {
            candidatesMap[candidate] = [];
          }
          candidatesMap[candidate].push(cell);
        }
      }
      const pairCandidates = Object.values(candidatesMap).filter(
        (c) => c.length === 2,
      );
      for (let i = 0; i < pairCandidates.length; i++) {
        for (let j = i + 1; j < pairCandidates.length; j++) {
          const a = pairCandidates[i];
          const b = pairCandidates[j];
          if (a[0] === b[0] && a[1] === b[1]) {
            // Only actionable if at least one paired cell has extra candidates to eliminate
            const hasElimination = a[0].candidates!.length > 2 || a[1].candidates!.length > 2;
            if (hasElimination) {
              return {
                cells: a,
                extra: `${GROUP_NAME[type]} ${index + 1}`,
              };
            }
          }
        }
      }
    }) || null;
  },
  // Check for three cells in a group whose combined candidates form exactly three digits.
  [MoveStrategy.NAKED_TRIPLE]: (board) => {
    return forEachGroup(board, (group, type, index) => {
      const unsolved = group.filter(
        (cell) => cell.value === undefined && (cell.candidates?.length ?? 0) >= 2 && (cell.candidates?.length ?? 0) <= 3,
      );
      for (let i = 0; i < unsolved.length; i++) {
        for (let j = i + 1; j < unsolved.length; j++) {
          for (let k = j + 1; k < unsolved.length; k++) {
            const union = new Set([
              ...unsolved[i].candidates!,
              ...unsolved[j].candidates!,
              ...unsolved[k].candidates!,
            ]);
            if (union.size !== 3) continue;
            const triple = [unsolved[i], unsolved[j], unsolved[k]];
            for (const cell of group) {
              if (!triple.includes(cell)
                && cell.value === undefined
                && cell.candidates?.some((c) => union.has(c))) {
                return {
                  cells: triple,
                  extra: `${GROUP_NAME[type]} ${index + 1}`
                };
              }
            }
          }
        }
      }
    }) || null;
  },
  // Check for three candidates in a group that only appear in the same three cells.
  [MoveStrategy.HIDDEN_TRIPLE]: (board) => {
    return forEachGroup(board, (group, type, index) => {
      const candidatesMap: Record<number, Cell[]> = {};
      for (const cell of group) {
        if (cell.value !== undefined) continue;
        for (const candidate of cell.candidates ?? []) {
          if (!candidatesMap[candidate]) candidatesMap[candidate] = [];
          candidatesMap[candidate].push(cell);
        }
      }
      // Only candidates confined to 2 or 3 cells can form a hidden triple
      const confined = Object.entries(candidatesMap).filter(([, c]) => c.length >= 2 && c.length <= 3);
      for (let i = 0; i < confined.length; i++) {
        for (let j = i + 1; j < confined.length; j++) {
          for (let k = j + 1; k < confined.length; k++) {
            const unionCells = new Set([...confined[i][1], ...confined[j][1], ...confined[k][1]]);
            if (unionCells.size !== 3) continue;
            const hiddenSet = new Set([Number(confined[i][0]), Number(confined[j][0]), Number(confined[k][0])]);
            // At least one cell in the triple must have extra candidates that can be eliminated
            for (const cell of unionCells) {
              for (const c of cell.candidates!) {
                if (!hiddenSet.has(c)) {
                  return {
                    cells: [...unionCells],
                    extra: `${GROUP_NAME[type]} ${index + 1}`
                  };
                }
              }
            }
          }
        }
      }
    }) || null;
  },
  // Check for locked candidates:
  // Type 1 (pointing): a candidate within a box is confined to one row or column
  //   → eliminate from the rest of that row/column outside the box.
  // Type 2 (box-line reduction): a candidate within a row/column is confined to one box
  //   → eliminate from the rest of that box.
  [MoveStrategy.LOCKED_CANDIDATES]: (board) => {
    // Type 1: pointing pairs/triples
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const boxCells: Cell[] = [];
        for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
          for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
            if (board[r][c].value === undefined) {
              boxCells.push(board[r][c]);
            }
          }
        }
        const candidatesInBox: Record<number, Cell[]> = {};
        for (const cell of boxCells) {
          for (const cand of cell.candidates ?? []) {
            if (!candidatesInBox[cand]) candidatesInBox[cand] = [];
            candidatesInBox[cand].push(cell);
          }
        }
        for (const candStr in candidatesInBox) {
          const cand = Number(candStr);
          const cells = candidatesInBox[cand];
          if (cells.length < 2) continue;
          const rows = [...new Set(cells.map((c) => c.row))];
          const cols = [...new Set(cells.map((c) => c.col))];
          if (rows.length === 1) {
            // All in the same row — can eliminate from rest of that row outside this box
            const victims = board[rows[0]].filter(
              (c) => c.value === undefined &&
                Math.floor(c.col / 3) !== boxCol &&
                c.candidates?.includes(cand),
            );
            if (victims.length > 0) {
              return {
                cells,
                extra: `eliminate ${cand} from Row ${rows[0] + 1} outside Box ${boxRow * 3 + boxCol + 1}`,
              };
            }
          }
          if (cols.length === 1) {
            // All in the same column — can eliminate from rest of that column outside this box
            const victims = board.map((row) => row[cols[0]]).filter(
              (c) => c.value === undefined &&
                Math.floor(c.row / 3) !== boxRow &&
                c.candidates?.includes(cand),
            );
            if (victims.length > 0) {
              return {
                cells,
                extra: `eliminate ${cand} from Column ${cols[0] + 1} outside Box ${boxRow * 3 + boxCol + 1}`,
              };
            }
          }
        }
      }
    }
    // Type 2: box-line reduction
    for (let r = 0; r < 9; r++) {
      const rowCells = board[r].filter((c) => c.value === undefined);
      const candidatesInRow: Record<number, Cell[]> = {};
      for (const cell of rowCells) {
        for (const cand of cell.candidates ?? []) {
          if (!candidatesInRow[cand]) candidatesInRow[cand] = [];
          candidatesInRow[cand].push(cell);
        }
      }
      for (const candStr in candidatesInRow) {
        const cand = Number(candStr);
        const cells = candidatesInRow[cand];
        if (cells.length < 2) continue;
        const boxCols = [...new Set(cells.map((c) => Math.floor(c.col / 3)))];
        if (boxCols.length === 1) {
          const boxCol = boxCols[0];
          const boxRow = Math.floor(r / 3);
          const victims: Cell[] = [];
          for (let br = boxRow * 3; br < boxRow * 3 + 3; br++) {
            if (br === r) continue;
            const c = board[br].filter(
              (cell) => cell.value === undefined &&
                Math.floor(cell.col / 3) === boxCol &&
                cell.candidates?.includes(cand),
            );
            victims.push(...c);
          }
          if (victims.length > 0) {
            return {
              cells,
              extra: `eliminate ${cand} from Box ${boxRow * 3 + boxCol + 1} outside Row ${r + 1}`,
            };
          }
        }
      }
    }
    for (let c = 0; c < 9; c++) {
      const colCells = board.map((row) => row[c]).filter((cell) => cell.value === undefined);
      const candidatesInCol: Record<number, Cell[]> = {};
      for (const cell of colCells) {
        for (const cand of cell.candidates ?? []) {
          if (!candidatesInCol[cand]) candidatesInCol[cand] = [];
          candidatesInCol[cand].push(cell);
        }
      }
      for (const candStr in candidatesInCol) {
        const cand = Number(candStr);
        const cells = candidatesInCol[cand];
        if (cells.length < 2) continue;
        const boxRows = [...new Set(cells.map((cell) => Math.floor(cell.row / 3)))];
        if (boxRows.length === 1) {
          const boxRow = boxRows[0];
          const boxCol = Math.floor(c / 3);
          const victims: Cell[] = [];
          for (let bc = boxCol * 3; bc < boxCol * 3 + 3; bc++) {
            if (bc === c) continue;
            const v = board.map((row) => row[bc]).filter(
              (cell) => cell.value === undefined &&
                Math.floor(cell.row / 3) === boxRow &&
                cell.candidates?.includes(cand),
            );
            victims.push(...v);
          }
          if (victims.length > 0) {
            return {
              cells,
              extra: `eliminate ${cand} from Box ${boxRow * 3 + boxCol + 1} outside Column ${c + 1}`,
            };
          }
        }
      }
    }
    return null;
  },
  // Check for a pivot cell linking two pincers that share a candidate to eliminate.
  [MoveStrategy.Y_WING]: (board) => {
    const bivalue: Cell[] = [];
    for (const row of board) {
      for (const cell of row) {
        if (cell.value === undefined && cell.candidates?.length === 2) {
          bivalue.push(cell);
        }
      }
    }
    for (const pivot of bivalue) {
      const [p, q] = pivot.candidates!;
      for (const pinB of bivalue) {
        if (pinB === pivot || !seesCell(pivot, pinB)) continue;
        if (!pinB.candidates!.includes(p) || pinB.candidates!.includes(q)) continue;
        const r = pinB.candidates!.find((c) => c !== p)!;
        for (const pinC of bivalue) {
          if (pinC === pivot || pinC === pinB || !seesCell(pivot, pinC)) continue;
          if (!pinC.candidates!.includes(q) || pinC.candidates!.includes(p)) continue;
          if (!pinC.candidates!.includes(r)) continue;
          // Pincers must not see each other — if they do, the pattern degenerates
          // into locked candidates and is not a true Y-wing.
          if (seesCell(pinB, pinC)) continue;
          // Valid Y-wing: find a victim that sees both pincers and holds r
          for (const row of board) {
            for (const cell of row) {
              if (cell.value === undefined
                && cell !== pivot && cell !== pinB && cell !== pinC
                && cell.candidates?.includes(r)
                && seesCell(cell, pinB) && seesCell(cell, pinC)) {
                return {
                  cells: [pivot, pinB, pinC],
                  extra: `Eliminate ${r} from ${cellPosition(cell)}`,
                };
              }
            }
          }
        }
      }
    }
    return null;
  },
  [MoveStrategy.UNKNOWN]: () => {
    return { cells: [] };
  },
};

export const cellPosition = (cell: Cell): string => {
  return `R${cell.row + 1}C${cell.col + 1}`;
};

const hintDescription = (strategy: MoveStrategy, result: StrategyResult): string => {
  const parts = [];
  if (result.cells.length > 0) {
    parts.push(result.cells.map(cellPosition).join(', '));
  }
  if (result.extra) {
    parts.push(result.extra);
  }
  let out = STRATEGY_MAP[strategy];
  if (parts.length > 0) {
    out += ` (${parts.join(' - ')})`;
  }
  return out;
};

export const getHint = (board: Board): Hint => {
  for (const strategy of STRATEGIES) {
    const check = STRATEGY_CHECKS[strategy];
    const result = check(board);
    if (result) {
      return {
        strategy,
        description: hintDescription(strategy, result),
        result,
      };
    }
  }
  return {
    strategy: MoveStrategy.UNKNOWN,
    description: STRATEGY_MAP[MoveStrategy.UNKNOWN],
    result: { cells: [] },
  };
};
