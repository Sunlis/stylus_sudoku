import React from 'react';
import { Button } from '@heroui/react';

import { PRIMARY_BUTTON } from '@app/style';
import type { Board } from '@app/types/board';
import questionIcon from '../static/question.svg';
import { getHint } from './hints';

interface HintPanelProps {
  cells: Board;
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
      const { strategy, description, cells } = getHint(this.props.cells);
      this.setState({ hintResult: description });
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
