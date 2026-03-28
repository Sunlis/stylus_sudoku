import React from 'react';
import { Difficulty } from './types';
import { userStorage } from './storage';

interface ControlsProps {
  onNewPuzzle: (difficulty: Difficulty) => void;
  eraseMode: boolean;
  onToggleEraseMode: () => void;
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
      <div style={{ width: '90vw', padding: '1rem 0 0 0' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '1rem',
          alignItems: 'center',
        }}>
          <button onClick={() => {
            this.dialogRef.current?.showModal();
          }}>New puzzle</button>
          <span>Pen mode:</span>
          <button onClick={this.props.onToggleEraseMode}>
            {this.props.eraseMode ? 'Eraser' : 'Draw'}
          </button>
        </div>
        <dialog ref={this.dialogRef}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            padding: '1rem',
          }}>
            <h2 style={{ padding: 0, margin: 0 }}>New game</h2>
            <select value={this.state.difficulty} onChange={(e) => {
              const newDifficulty = e.target.value as Difficulty;
              this.setState({ difficulty: newDifficulty });
              userStorage.setDifficulty(newDifficulty);
            }}>
              <option value='easy'>Easy</option>
              <option value='medium'>Medium</option>
              <option value='hard'>Hard</option>
              <option value='expert'>Expert</option>
            </select>
            <button onClick={() => {
              this.props.onNewPuzzle(this.state.difficulty);
              this.dialogRef.current?.close();
            }}>Start</button>
            <hr style={{ width: '100%' }} />
            <button onClick={() => {
              this.dialogRef.current?.close();
            }}>Cancel</button>
          </div>
        </dialog>
      </div>
    );
  }
}