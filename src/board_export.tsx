import React from 'react';

import { BoardProps } from './board';

export class BoardExport extends React.Component<BoardProps> {
  render() {
    let boardString = '';
    for (let i = 0; i < 81; i++) {
      const row = Math.floor(i / 9);
      const col = i % 9;
      const cell = this.props.cells[row][col];
      if (cell.value !== undefined) {
        boardString += cell.value.toString();
      } else {
        boardString += '0';
      }
    }
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <pre style={{
          flex: '0',
          width: '70vw',
          margin: '0.5rem',
          padding: '0.5rem',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          backgroundColor: '#d5d5d5',
        }}>
          {boardString}
        </pre>
        <button
          style={{
            margin: '0 1rem',
            flex: '1',
          }}
          onClick={() => {
            navigator.clipboard.writeText(boardString);
          }}>Copy</button>
      </div>
    );
  }
}
