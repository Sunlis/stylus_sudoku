import { CellContents } from "@app/types/board";

export function isBoardValid(board: CellContents[][]): boolean {
  // Check rows and columns
  for (let i = 0; i < 9; i++) {
    if (!isRowValid(board, i) || !isColumnValid(board, i)) {
      return false;
    }
  }
  // Check boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      if (!isBoxValid(board, boxRow, boxCol)) {
        return false;
      }
    }
  }
  return true;
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
