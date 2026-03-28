import React from 'react';
import copyIcon from '../static/copy.svg';

import { CellContents } from './board';

interface ExportProps {
  cells: CellContents[][];
}

export class BoardExport extends React.Component<ExportProps> {
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
        width: '100%',
      }}>
        <pre style={{
          flex: '1 1 auto',
          margin: '0.5rem',
          padding: '0.5rem',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          overflowWrap: 'break-word',
          backgroundColor: '#c0c6d4',
          color: '#020617',
          borderRadius: '0.75rem',
          border: '1px solid rgba(148,163,184,0.6)',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        }}>
          {boardString}
        </pre>
        <button
          style={{
            margin: '0 0.75rem 0 0.25rem',
            flex: '0 0 auto',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.5rem',
            border: '1px solid rgba(148,163,184,0.8)',
            backgroundColor: '#0f172a',
            color: '#f9fafb',
            fontWeight: 500,
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(15,23,42,0.85)',
          }}
          onClick={() => {
            navigator.clipboard.writeText(boardString);
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
            <img src={copyIcon} alt="" style={{ width: '16px', height: '16px' }} />
            <span>Copy</span>
          </span>
        </button>
      </div>
    );
  }
}
