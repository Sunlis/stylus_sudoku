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

export type Group = Cell[];

export type KillerArea = {
  cells: CellPosition[];
  sum: number;
};

export type Board = {
  grid: Cell[][];
  killerAreas: KillerArea[];
};

export function createBoard(
  createContents: (row: number, col: number) => CellContents = () => ({}),
  killerAreas: KillerArea[] = [],
): Board {
  const grid = Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 9 }, (_, col) => ({
      ...createContents(row, col),
      row,
      col,
    })),
  );
  return { grid, killerAreas };
}
