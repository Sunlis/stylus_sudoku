import React from "react";

import { InputPanel } from "@app/input_panel";
import { CellContents } from "@app/types/board";


class CandidateCell extends React.Component<{ number: number; visible: boolean; }> {
  render() {
    return (
      <div
        className="flex h-[3vw] w-[3vw] items-center justify-center text-[0.6rem] text-slate-500"
        style={{ textAlign: 'center' }}
      >
        {this.props.visible ? this.props.number : ' '}
      </div>
    );
  }
}

export interface CellProps extends CellContents {
  column: number;
  row: number;
  setNumber?: (num: number | null) => void;
  eraseMode?: boolean;
  onRecognitionCandidates?: (row: number, column: number, candidates: string[]) => void;
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
    } else if (this.props.candidates !== undefined) {
      interior = (
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.55em' }}>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <CandidateCell number={1} visible={this.props.candidates.includes(1)} />
            <CandidateCell number={2} visible={this.props.candidates.includes(2)} />
            <CandidateCell number={3} visible={this.props.candidates.includes(3)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <CandidateCell number={4} visible={this.props.candidates.includes(4)} />
            <CandidateCell number={5} visible={this.props.candidates.includes(5)} />
            <CandidateCell number={6} visible={this.props.candidates.includes(6)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <CandidateCell number={7} visible={this.props.candidates.includes(7)} />
            <CandidateCell number={8} visible={this.props.candidates.includes(8)} />
            <CandidateCell number={9} visible={this.props.candidates.includes(9)} />
          </div>
        </div>
      );
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
          onCandidatesRecognized={(candidates) => {
            this.props.onRecognitionCandidates?.(this.props.row, this.props.column, candidates);
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
    if (this.props.valid === false) {
      bg = '#ffcccc';
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
