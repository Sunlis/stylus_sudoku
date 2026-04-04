import React from "react";

import type { Board as SudokuBoard, Cell as SudokuCell, Group } from "@app/types/board";
import { Cell } from "@app/board/cell";
import type { RecognitionOutcome } from "@app/handwriting";

interface BoardProps {
  cells: SudokuBoard;
  onChangeCell: (cell: SudokuCell) => void;
  eraseMode: boolean;
  onToggleCandidate?: (row: number, col: number, num: number) => void;
  onRecognitionCandidates?: (row: number, column: number, outcome: RecognitionOutcome) => void;
  highlightDigit?: number;
}

interface BoardState {
}

export class Board extends React.Component<BoardProps, BoardState> {

  render() {
    return (
      <div
        id="sudoku-board-root"
        className="flex flex-col items-center"
        onContextMenu={(event) => {
          event.preventDefault();
        }}
      >
        <div
          className="border-2 border-slate-900/90"
          style={{
            borderLeft: 'none',
            borderTop: 'none',
            boxSizing: 'border-box',
          }}
        >
          {
            this.props.cells.map((group: Group, rowIndex) => {
              return (<div key={rowIndex} className="flex flex-row">
                {
                  group.map((cell: SudokuCell, colIndex) => {
                    return <Cell
                      key={`${rowIndex}-${colIndex}`}
                      eraseMode={this.props.eraseMode}
                      highlightDigit={this.props.highlightDigit}
                      onToggleCandidate={(num) => {
                        this.props.onToggleCandidate?.(cell.row, cell.col, num);
                      }}
                      onRecognitionCandidates={this.props.onRecognitionCandidates}
                      setNumber={(num: number | null) => {
                        this.props.onChangeCell({
                          ...cell,
                          value: num ?? undefined,
                          user: true,
                        });
                      }}
                      {...cell} />;
                  })
                }
              </div>
              );
            })
          }
        </div>
      </div>
    );
  }
}
