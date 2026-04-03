import React from 'react';
import { Button } from '@heroui/react';

import { getHintDescription, getSudokuCoreHint } from '@app/hints';
import { PRIMARY_BUTTON } from '@app/style';
import type { CellContents } from '@app/types/board';
import questionIcon from '../static/question.svg';

interface HintPanelProps {
  cells: CellContents[][];
}

interface HintPanelState {
  hintResult: string | null;
}

export class HintPanel extends React.Component<HintPanelProps, HintPanelState> {
  hintFadeTimeout: NodeJS.Timeout | null = null;

  constructor(props: HintPanelProps) {
    super(props);
    this.state = {
      hintResult: null,
    };
  }

  handleHint = () => {
    if (this.hintFadeTimeout) {
      clearTimeout(this.hintFadeTimeout);
    }
    this.setState({ hintResult: null }, () => {
      try {
        const result = getSudokuCoreHint(this.props.cells);
        const description = getHintDescription(result);
        this.setState({ hintResult: description });
      } catch (error) {
        console.error('sudoku-core hint failed', error);
        this.setState({ hintResult: 'Failed to get hint' });
      }
      this.hintFadeTimeout = setTimeout(() => {
        this.setState({ hintResult: null });
      }, 6000);
    });
  };

  render() {
    return (
      <section className="w-full rounded-2xl bg-white/90 p-3 text-slate-800 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-3">
          <div style={{
            fontSize: '0.8rem',
          }}>
            {this.state.hintResult && <p className="fade-out">{this.state.hintResult}</p>}
          </div>
          <Button className={PRIMARY_BUTTON} color="primary" onClick={this.handleHint} style={{ flex: 0, padding: '0 1.5rem' }}>
            <img src={questionIcon} alt="" className="h-5 w-5" />
            Hint
          </Button>
        </div>
      </section>
    );
  }
}
