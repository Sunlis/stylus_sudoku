import React from "react";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./style";

type VictoryProps = {
  onNewGame: () => void;
};

export class VictoryDialog extends React.Component<VictoryProps, {}> {
  ref = React.createRef<HTMLDialogElement>();

  show() {
    this.ref.current?.showModal();
  }

  hide() {
    this.ref.current?.close();
  }

  render(): JSX.Element {
    return (
      <dialog
        ref={this.ref}
        style={{
          border: 'none',
          borderRadius: '0.75rem',
          padding: '24px 8px',
          boxShadow: '0 16px 40px rgba(15, 23, 42, 0.35)',
          maxWidth: '420px',
          width: '90vw',
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111' }}>Victory!</h2>
          <button
            onClick={this.props.onNewGame}
            className={PRIMARY_BUTTON}
          >
            Start new game
          </button>
          <button
            onClick={() => this.ref.current?.close()}
            className={SECONDARY_BUTTON}
          >
            Close
          </button>
        </div>
      </dialog>
    );
  }
}
