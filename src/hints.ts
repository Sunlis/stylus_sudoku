import { forEachCell, forEachGroup, GroupType } from './sudoku';
import { Board, Cell } from './types/board';

enum MoveStrategy {
  UNKNOWN,
  SINGLE_CANDIDATE, // A cell contains only one candidate
  LONE_CANDIDATE, // A candidate is only present in one cell in a group
  NAKED_PAIR, // A pair of cells in a group have only the same two candidates
  HIDDEN_PAIR, // A pair of candidates in a group are only present in the same two cells
  POINTING_ELIMINATION // A candidate appears in only one row/column within a box
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
  MoveStrategy.POINTING_ELIMINATION,
  MoveStrategy.UNKNOWN,
];

const STRATEGY_MAP: Record<MoveStrategy, string> = {
  [MoveStrategy.UNKNOWN]: "No hints available.",
  [MoveStrategy.SINGLE_CANDIDATE]: "A cell contains only one candidate.",
  [MoveStrategy.LONE_CANDIDATE]: "Group has only one valid position for a candidate.",
  [MoveStrategy.NAKED_PAIR]: "Group has a candidate that only appears in one cell.",
  [MoveStrategy.HIDDEN_PAIR]: "Group contains two cells with the same two candidates.",
  [MoveStrategy.POINTING_ELIMINATION]: "Candidate appears in only one row/column within a box.",
};

const GROUP_NAME = {
  [GroupType.ROW]: "Row",
  [GroupType.COLUMN]: "Column",
  [GroupType.BOX]: "Box",
};

const STRATEGY_CHECKS: Record<MoveStrategy, (cells: Board) => null | StrategyResult> = {
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
  [MoveStrategy.NAKED_PAIR]: (cells) => {
    return null;
  },
  [MoveStrategy.HIDDEN_PAIR]: (cells) => {
    return null;
  },
  [MoveStrategy.POINTING_ELIMINATION]: (cells) => {
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
