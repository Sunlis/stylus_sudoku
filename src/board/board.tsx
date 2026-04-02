import React from "react";

import { CellContents } from "@app/types/board";
import { Cell } from "@app/board/cell";
import type { RecognitionOutcome } from "@app/handwriting";

interface BoardProps {
  cells: CellContents[][];
  onChangeCell: (row: number, column: number, contents: CellContents) => void;
  eraseMode: boolean;
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
            Array.from({ length: 9 }, (_, rowIndex) => {
              return (<div key={rowIndex} className="flex flex-row">
                {
                  Array.from({ length: 9 }, (_, colIndex) => {
                    return <Cell
                      key={colIndex}
                      column={colIndex}
                      row={rowIndex}
                      eraseMode={this.props.eraseMode}
                      highlightDigit={this.props.highlightDigit}
                      onRecognitionCandidates={this.props.onRecognitionCandidates}
                      setNumber={(num: number | null) => {
                        this.props.onChangeCell(rowIndex, colIndex, {
                          ...this.props.cells[rowIndex][colIndex],
                          value: num ?? undefined,
                          user: true,
                        });
                      }}
                      {...(this.props.cells?.[rowIndex]?.[colIndex])} />;
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
