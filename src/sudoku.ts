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

// Just naively fill all empty cells with all 9 numbers.
function fillAllCandidates(board: CellContents[][]): CellContents[][] {
  return board.map((rowArr, row) => {
    return rowArr.map((cell, col) => {
      if (cell.value !== undefined) {
        return cell;
      }
      return {
        ...cell,
        candidates: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      };
    });
  });
}

// Clear the given cell's number from all relevant candidates.
export function clearRelatedCandidates(board: CellContents[][], cellRow: number, cellCol: number): CellContents[][] {
  const value = board[cellRow][cellCol].value;
  if (value === undefined) {
    return board;
  }

  // Row
  for (let col = 0; col < 9; col++) {
    const cell = board[cellRow][col];
    if (!cell.candidates) {
      continue;
    }
    cell.candidates = cell.candidates.filter((candidate) => candidate !== value);
  }

  // Column
  for (let row = 0; row < 9; row++) {
    const cell = board[row][cellCol];
    if (!cell.candidates) {
      continue;
    }
    cell.candidates = cell.candidates.filter((candidate) => candidate !== value);
  }

  // Box
  const boxRow = Math.floor(cellRow / 3);
  const boxCol = Math.floor(cellCol / 3);
  for (let row = boxRow * 3; row < boxRow * 3 + 3; row++) {
    for (let col = boxCol * 3; col < boxCol * 3 + 3; col++) {
      const cell = board[row][col];
      if (!cell.candidates) {
        continue;
      }
      cell.candidates = cell.candidates.filter((candidate) => candidate !== value);
    }
  }

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
