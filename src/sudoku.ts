import { Board, Cell, Group } from "@app/types/board";

export enum GroupType {
  ROW,
  COLUMN,
  BOX
}

/**
 * Run the callback for each "group" in the board (row, column, or box).
 * If the callback returns true, iteration will stop early.
 */
export function forEachGroup<T>(
  board: Board,
  callback: (group: Group, type: GroupType, index: number) => T | void): T | void {
  // Rows
  for (let row = 0; row < 9; row++) {
    const rowGroup = board[row];
    const result = callback(rowGroup, GroupType.ROW, row);
    if (result !== undefined) {
      return result;
    }
  }

  // Columns
  for (let col = 0; col < 9; col++) {
    const colGroup = [];
    for (let row = 0; row < 9; row++) {
      colGroup.push(board[row][col]);
    }
    const result = callback(colGroup, GroupType.COLUMN, col);
    if (result !== undefined) {
      return result;
    }
  }

  // Boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const boxGroup = [];
      for (let row = boxRow * 3; row < boxRow * 3 + 3; row++) {
        for (let col = boxCol * 3; col < boxCol * 3 + 3; col++) {
          boxGroup.push(board[row][col]);
        }
      }
      const result = callback(boxGroup, GroupType.BOX, boxRow * 3 + boxCol);
      if (result !== undefined) {
        return result;
      }
    }
  }
}

export function forEachCell<T>(
  board: Board,
  callback: (cell: Cell, row: number, col: number, index: number) => T | void): T | void {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const result = callback(board[row][col], row, col, (row * 9) + col);
      if (result !== undefined) {
        return result;
      }
    }
  }
}

export function boxIndex(row: number, col: number): number {
  const boxRow = Math.floor(row / 3);
  const boxCol = Math.floor(col / 3);
  return boxRow * 3 + boxCol;
}

export function isBoardValid(board: Board): boolean {
  let valid = true;
  forEachGroup(board, (group) => {
    const seen = new Set<number>();
    for (const cell of group) {
      if (cell.value !== undefined) {
        if (seen.has(cell.value)) {
          valid = false;
          return true; // Group is invalid, stop iteration.
        }
        seen.add(cell.value);
      }
    }
  });
  return valid;
}

export function isRowValid(board: Board, row: number): boolean {
  const seen = new Set<number>();
  for (let col = 0; col < 9; col++) {
    const value = board[row][col].value;
    if (value !== undefined) {
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
    }
  }
  return true;
}

export function isColumnValid(board: Board, col: number): boolean {
  const seen = new Set<number>();
  for (let row = 0; row < 9; row++) {
    const value = board[row][col].value;
    if (value !== undefined) {
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
    }
  }
  return true;
}

export function isBoxValid(board: Board, boxRow: number, boxCol: number): boolean {
  const seen = new Set<number>();
  for (let row = boxRow * 3; row < boxRow * 3 + 3; row++) {
    for (let col = boxCol * 3; col < boxCol * 3 + 3; col++) {
      const value = board[row][col].value;
      if (value !== undefined) {
        if (seen.has(value)) {
          return false;
        }
        seen.add(value);
      }
    }
  }
  return true;
}

// Just naively fill all empty cells with all 9 numbers.
function fillAllCandidates(board: Board): Board {
  forEachCell(board, (cell, row, col) => {
    if (cell.value === undefined) {
      cell.candidates = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    }
  });
  return board;
}

// Clear the given cell's number from all relevant candidates.
export function clearRelatedCandidates(board: Board, cellRow: number, cellCol: number): Board {
  const value = board[cellRow][cellCol].value;
  if (value === undefined) {
    return board;
  }

  forEachCell(board, (cell, row, col) => {
    if (!cell.candidates) {
      return;
    }
    if (cellRow == row || cellCol == col || boxIndex(cellRow, cellCol) == boxIndex(row, col)) {
      cell.candidates = cell.candidates.filter((candidate) => candidate !== value);
    }
  });

  return board;
}

export function fillCandidates(board: Board): Board {
  const newBoard: Board = fillAllCandidates(board);
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (newBoard[row][col].value !== undefined) {
        clearRelatedCandidates(newBoard, row, col);
      }
    }
  }
  return newBoard;
}
