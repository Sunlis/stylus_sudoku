import { CellContents } from "@app/types/board";

/**
 * Run the callback for each "group" in the board (row, column, or box).
 * If the callback returns true, iteration will stop early.
 */
export function forEachGroup(board: CellContents[][], callback: (group: CellContents[]) => boolean | void): void {
  // Rows
  for (let row = 0; row < 9; row++) {
    const rowGroup = board[row];
    if (callback(rowGroup)) {
      return;
    }
  }

  // Columns
  for (let col = 0; col < 9; col++) {
    const colGroup = [];
    for (let row = 0; row < 9; row++) {
      colGroup.push(board[row][col]);
    }
    if (callback(colGroup)) {
      return;
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
      if (callback(boxGroup)) {
        return;
      }
    }
  }
}

export function forEachCell(board: CellContents[][], callback: (cell: CellContents, row: number, col: number) => void): void {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      callback(board[row][col], row, col);
    }
  }
}

export function boxIndex(row: number, col: number): number {
  const boxRow = Math.floor(row / 3);
  const boxCol = Math.floor(col / 3);
  return boxRow * 3 + boxCol;
}

export function isBoardValid(board: CellContents[][]): boolean {
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

export function isRowValid(board: CellContents[][], row: number): boolean {
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

export function isColumnValid(board: CellContents[][], col: number): boolean {
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

export function isBoxValid(board: CellContents[][], boxRow: number, boxCol: number): boolean {
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
function fillAllCandidates(board: CellContents[][]): CellContents[][] {
  forEachCell(board, (cell, row, col) => {
    if (cell.value === undefined) {
      cell.candidates = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    }
  });
  return board;
}

// Clear the given cell's number from all relevant candidates.
export function clearRelatedCandidates(board: CellContents[][], cellRow: number, cellCol: number): CellContents[][] {
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

export function fillCandidates(board: CellContents[][]): CellContents[][] {
  const newBoard: CellContents[][] = fillAllCandidates(board);
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (newBoard[row][col].value !== undefined) {
        clearRelatedCandidates(newBoard, row, col);
      }
    }
  }
  return newBoard;
}
