import React from "react";

import { InputPanel } from "@app/input_panel";
import type { Cell as SudokuCell } from "@app/types/board";
import type { RecognitionOutcome } from "@app/handwriting";
import { userStorage } from "../storage";
import { Signal, subscribe } from "../signals";
import { colorToString } from "../colour";
import { throttle } from "../util";

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
      padding: '6px 3px 2px 3px',
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
            fontSize: 'clamp(0.55rem, min(2.8vw, 2.8vh), 0.85rem)',
            lineHeight: 1,
            color: isSet ? (isHighlighted ? '#fff' : '#334155') : 'transparent',
            backgroundColor: isHighlighted ? '#000' : 'transparent',
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

export class Cell extends React.Component<CellProps, { inc: number; }> {
  constructor(props: CellProps) {
    super(props);
    this.state = {
      inc: 0,
    };
    subscribe(Signal.UPDATE_THEME, throttle(() => {
      this.setState({ inc: this.state.inc + 1 });
    }, 100));
  }
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
        {showCandidateGrid && (
          <CandidateGrid
            candidates={this.props.candidates}
            interactive={false}
            highlightDigit={this.props.highlightDigit}
          />
        )}
        {interior}
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
    const theme = userStorage.getTheme();
    if (this.props.value !== undefined) {
      if (this.props.user) {
        border = colorToString(theme.userCellBackground);
      } else {
        border = colorToString(theme.fixedCellBackground);
      }
      color = colorToString(theme.cellTextColor);
    } else {
      color = colorToString(theme.candidateTextColor);
    }

    if (this.props.highlightDigit && this.props.value === this.props.highlightDigit) {
      if (this.props.user) {
        bg = colorToString(theme.userHighlightBackground);
      } else {
        bg = colorToString(theme.fixedHighlightBackground);
      }
    }

    if (this.props.valid === false) {
      bg = colorToString(theme.invalidCellBackground);
    }

    const cellClassNames = [
      'flex',
      'h-[min(10vw,10vh,64px)]',
      'w-[min(10vw,10vh,64px)]',
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
