import React from 'react';
import { Button } from '@heroui/react';
import pencilIcon from '../static/pencil.svg';
import eraserIcon from '../static/eraser.svg';
import gridIcon from '../static/grid.svg';
import undoIcon from '../static/undo.svg';
import { Difficulty } from './types';
import { userStorage } from './storage';

interface ControlsProps {
  onNewPuzzle: (difficulty: Difficulty) => void;
  eraseMode: boolean;
  onToggleEraseMode: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

interface ControlsState {
  difficulty: Difficulty;
  showDialog: boolean;
}

export class Controls extends React.Component<ControlsProps, ControlsState> {
  dialogRef: React.RefObject<HTMLDialogElement> = React.createRef();

  constructor(props: ControlsProps) {
    super(props);
    this.state = {
      difficulty: userStorage.getDifficulty(),
      showDialog: false,
    };
  }

  render() {
    return (
      <div className="w-full flex flex-col gap-2 rounded-2xl bg-white/90 p-2 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-4">
          <Button
            onClick={() => {
              this.dialogRef.current?.showModal();
            }}
            color="primary"
            variant="solid"
            className="font-medium rounded-lg border border-slate-900 bg-slate-900 px-4 py-2 text-white shadow-[0_2px_4px_rgba(15,23,42,0.85)] hover:bg-slate-800"
          >
            <span className="flex items-center gap-2">
              <img src={gridIcon} alt="" className="h-5 w-5" />
              <span>New puzzle</span>
            </span>
          </Button>
          <div className="flex items-center gap-2">
            <Button
              isIconOnly
              aria-label="Undo last move"
              onClick={this.props.onUndo}
              isDisabled={!this.props.canUndo}
              variant="bordered"
              className="h-10 w-10 rounded-full border border-slate-600 bg-slate-100 text-slate-800 shadow-[0_2px_4px_rgba(15,23,42,0.85)] hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100"
            >
              <img
                src={undoIcon}
                alt=""
                className="h-6 w-6"
              />
            </Button>
            <Button
              isIconOnly
              aria-label={this.props.eraseMode ? 'Eraser mode' : 'Draw mode'}
              onClick={this.props.onToggleEraseMode}
              variant="bordered"
              className="h-10 w-10 rounded-full border border-slate-600 bg-slate-100 text-slate-800 shadow-[0_2px_4px_rgba(15,23,42,0.85)] hover:bg-slate-200"
            >
              <img
                src={this.props.eraseMode ? eraserIcon : pencilIcon}
                alt=""
                className="h-6 w-6"
              />
            </Button>
          </div>
        </div>
        <dialog
          ref={this.dialogRef}
          style={{
            border: 'none',
            borderRadius: '0.75rem',
            padding: 0,
            boxShadow: '0 16px 40px rgba(15, 23, 42, 0.35)',
            maxWidth: '420px',
            width: '90vw',
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            padding: '1.25rem 1.5rem 1.25rem 1.5rem',
            backgroundColor: 'white',
            borderRadius: '0.75rem',
          }}>
            <h2 className="text-base font-semibold text-slate-900" style={{ padding: 0, margin: 0 }}>New game</h2>
            <select value={this.state.difficulty} onChange={(e) => {
              const newDifficulty = e.target.value as Difficulty;
              this.setState({ difficulty: newDifficulty });
              userStorage.setDifficulty(newDifficulty);
            }} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-400/70">
              <option value='easy'>Easy</option>
              <option value='medium'>Medium</option>
              <option value='hard'>Hard</option>
              <option value='expert'>Expert</option>
            </select>
            <Button
              className="mt-1 rounded-lg border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-[0_2px_4px_rgba(15,23,42,0.85)] hover:bg-slate-800"
              onClick={() => {
                this.props.onNewPuzzle(this.state.difficulty);
                this.dialogRef.current?.close();
              }}
              color="primary"
            >
              Start
            </Button>
            <hr style={{ width: '100%' }} />
            <Button
              className="rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 shadow-[0_2px_4px_rgba(15,23,42,0.85)] hover:bg-slate-200"
              variant="bordered"
              onClick={() => {
                this.dialogRef.current?.close();
              }}
            >
              Cancel
            </Button>
          </div>
        </dialog>
      </div>
    );
  }
}