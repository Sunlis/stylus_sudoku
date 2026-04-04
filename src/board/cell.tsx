import React from "react";

import { InputPanel } from "@app/input_panel";
import type { Cell as SudokuCell } from "@app/types/board";
import type { RecognitionOutcome } from "@app/handwriting";

export interface CellProps extends SudokuCell {
  setNumber?: (num: number | null) => void;
  eraseMode?: boolean;
  onRecognitionCandidates?: (row: number, column: number, outcome: RecognitionOutcome) => void;
  onToggleCandidate?: (num: number) => void;
  highlightDigit?: number;
}

const CANDIDATE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

const CandidateGrid: React.FC<{
  candidates: number[] | undefined;
  interactive: boolean;
  highlightDigit?: number;
  onToggle?: (num: number) => void;
}> = ({ candidates, interactive, highlightDigit, onToggle }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateRows: 'repeat(3, 1fr)',
      pointerEvents: interactive ? 'auto' : 'none',
    }}
  >
    {CANDIDATE_NUMBERS.map((num) => {
      const isSet = candidates?.includes(num) ?? false;
      const isHighlighted = isSet && highlightDigit === num;
      return (
        <div
          key={num}
          onPointerDown={interactive ? (e) => { e.preventDefault(); e.stopPropagation(); onToggle?.(num); } : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(0.55rem, 2.8vw, 0.85rem)',
            lineHeight: 1,
            color: isSet ? (isHighlighted ? '#fff' : '#334155') : 'transparent',
            backgroundColor: isHighlighted ? 'rgba(191, 77, 252, 0.75)' : 'transparent',
            borderRadius: '6px',
            cursor: interactive ? 'pointer' : 'default',
            userSelect: 'none',
          }}
        >
          {num}
        </div>
      );
    })}
  </div>
);

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
      const showCandidateGrid = this.props.value === undefined;
      interior = <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}>
        <InputPanel
          anchor={{ x: 0, y: 0 }}
          canvasSize={100}
          eraseMode={this.props.eraseMode}
          storageKey={`${this.props.row},${this.props.col}`}
          onNumberRecognized={(num) => {
            this.props.setNumber?.(num);
          }}
          onClearCell={() => {
            this.props.setNumber?.(null);
          }}
          onCandidatesRecognized={(outcome) => {
            this.props.onRecognitionCandidates?.(this.props.row, this.props.col, outcome);
          }}
          onTap={(pos) => {
            const subCol = Math.min(2, Math.floor(pos.x / (100 / 3)));
            const subRow = Math.min(2, Math.floor(pos.y / (100 / 3)));
            const num = subRow * 3 + subCol + 1;
            this.props.onToggleCandidate?.(num);
          }}
        />
        {interior}
        {showCandidateGrid && (
          <CandidateGrid
            candidates={this.props.candidates}
            interactive={false}
            highlightDigit={this.props.highlightDigit}
          />
        )}
      </div>;
    }
    let color = '#000000';
    let bg = 'unset';
    let border = undefined;
    let borderLeft = 1;
    let borderTop = 1;
    if (this.props.col % 3 === 0) {
      borderLeft = 2;
    }
    if (this.props.row % 3 === 0) {
      borderTop = 2;
    }
    if (this.props.value !== undefined) {
      if (this.props.user) {
        border = 'rgba(72, 150, 134, 0.3)';
      } else {
        border = 'rgba(33, 21, 4, 0.2)';
      }
    } else {
      color = '#444';
    }

    if (this.props.highlightDigit && this.props.value === this.props.highlightDigit) {
      if (this.props.user) {
        bg = 'rgba(191, 77, 252, 0.75)';
      } else {
        bg = 'rgba(248, 224, 129, 0.7)';
      }
    }

    if (this.props.valid === false) {
      bg = 'rgba(255, 100, 100, 0.5)';
    }

    const cellClassNames = [
      'flex h-[10vw]',
      'w-[10vw]',
      'items-center',
      'justify-center',
      'bg-white',
      'text-slate-900',
      'sudoku-cell',
      (this.props.user ? 'sudoku-cell-user' : ''),
    ].filter(a => !!a).join(' ');

    return (
      <div style={{
        borderLeftWidth: borderLeft,
        borderTopWidth: borderTop,
        borderRight: 'none',
        borderBottom: 'none',
        borderColor: '#000',
      }}>
        <div
          className={cellClassNames}
          style={{
            boxSizing: 'border-box',
            color,
            border: border ? `8px solid ${border}` : undefined,
            backgroundColor: bg,
          }}
        >
          {interior}
        </div>
      </div>
    );
  }
}
