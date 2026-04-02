import React from "react";

import { InputPanel } from "@app/input_panel";
import { CellContents } from "@app/types/board";
import type { RecognitionOutcome } from "@app/handwriting";

export interface CellProps extends CellContents {
  column: number;
  row: number;
  setNumber?: (num: number | null) => void;
  eraseMode?: boolean;
  onRecognitionCandidates?: (row: number, column: number, outcome: RecognitionOutcome) => void;
  highlightDigit?: number;
}

export class Cell extends React.Component<CellProps> {
  render() {
    let interior = <div></div>;
    if (this.props.value !== undefined) {
      interior = <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>{this.props.value}</div>;
    }
    if (this.props.user) {
      interior = <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}>
        <InputPanel
          anchor={{ x: 0, y: 0 }}
          canvasSize={100}
          eraseMode={this.props.eraseMode}
          storageKey={`${this.props.row},${this.props.column}`}
          onNumberRecognized={(num) => {
            this.props.setNumber?.(num);
          }}
          onClearCell={() => {
            this.props.setNumber?.(null);
          }}
          onCandidatesRecognized={(outcome) => {
            this.props.onRecognitionCandidates?.(this.props.row, this.props.column, outcome);
          }}
        />
        {interior}
      </div>;
    }
    let color = '#000000';
    let bg = 'unset';
    let fontSize = '1rem';
    let borderLeft = 1;
    let borderTop = 1;
    if (this.props.column % 3 === 0) {
      borderLeft = 2;
    }
    if (this.props.row % 3 === 0) {
      borderTop = 2;
    }
    if (this.props.value !== undefined) {
      if (this.props.user) {
        color = '#000';
        fontSize = '1.1rem';
      } else {
        bg = 'rgba(0, 0, 0, 0.1)';
      }
    } else {
      color = '#444';
    }

    if (this.props.highlightDigit && this.props.value === this.props.highlightDigit) {
      if (this.props.user) {
        bg = 'rgba(252, 211, 77, 0.75)'; // warm highlight for user-filled cells
      } else {
        bg = 'rgba(129, 140, 248, 0.7)'; // cooler highlight for given cells
      }
    }

    if (this.props.valid === false) {
      if (this.props.user) {
        bg = 'rgba(255, 100, 100, 0.3)';
      } else {
        bg = 'rgba(100, 0, 0, 0.3)';
      }
    }

    const cellClassNames = [
      'flex h-[10vw]',
      'w-[10vw]',
      'items-center',
      'justify-center',
      'border',
      'border-slate-800/80',
      'bg-white',
      'text-slate-900',
      'sudoku-cell',
      (this.props.user ? 'sudoku-cell-user' : ''),
    ].filter(a => !!a).join(' ');

    return (
      <div
        className={cellClassNames}
        style={{
          borderLeftWidth: borderLeft,
          borderTopWidth: borderTop,
          borderRight: 'none',
          borderBottom: 'none',
          boxSizing: 'border-box',
          backgroundColor: bg,
          color,
        }}
      >
        {interior}
      </div>
    );
  }
}
