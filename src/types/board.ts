export interface CellContents {
  value?: number;
  candidates?: number[];
  valid?: boolean;
  user?: boolean;
}

export interface CellPosition {
  row: number;
  col: number;
}

export type Cell = CellContents & CellPosition;

export type Board = Cell[][];

export type Group = Cell[];

export function createBoard(
  createContents: (row: number, col: number) => CellContents = () => ({}),
): Board {
  return Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 9 }, (_, col) => ({
      ...createContents(row, col),
      row,
      col,
    })),
  );
}
