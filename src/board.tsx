import React from 'react';

class CandidateCell extends React.Component<{ number: number; visible: boolean }> {
  render() {
    return (
      <div style={{
          textAlign: 'center',
          width: '3vw',
          height: '3vw',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        {this.props.visible ? this.props.number : ' '}
      </div>
    );
  }
}

interface CellContents {
  value?: number;
  candidates?: number[];
  valid?: boolean;
  user?: boolean;
}

export interface CellProps extends CellContents {
  column: number;
  row: number;
}

class Cell extends React.Component<CellProps> {
  render() {
    let interior = <div></div>;
    if (this.props.value !== undefined) {
      interior = <div>{this.props.value}</div>;
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
    let color = '#000000';
    let weight = 'normal';
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
      weight = '500';
      if (this.props.user) {
        color = '#000';
        fontSize = '1.1rem';
      } else {
        bg = '#dcdcdc';
      }
    } else {
      color = '#444';
    }
    if (this.props.valid === false) {
      bg = '#ffcccc';
    }

    return (
      <div style={{
          border: '1px solid black',
          borderLeftWidth: borderLeft,
          borderTopWidth: borderTop,
          borderRight: 'none',
          borderBottom: 'none',
          boxSizing: 'border-box',
          width: '9vw',
          height: '9vw',
          backgroundColor: bg,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color,
          fontWeight: weight,
          fontSize,
        }}>
        {interior}
      </div>
    );
  }
}

export interface BoardProps {
  cells: CellContents[][];
}

export class Board extends React.Component<BoardProps> {
  render() {
    return (
      <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center' }}>
        <div style={{
          border: '2px solid black',
          borderLeft: 'none',
          borderTop: 'none',
          boxSizing: 'border-box',
        }}>
          {
            Array.from({ length: 9 }, (_, rowIndex) => {
              return (<div key={rowIndex} style={{ display: 'flex', flexDirection: 'row' }}>
                {
                  Array.from({ length: 9 }, (_, colIndex) => {
                    return <Cell key={colIndex} column={colIndex} row={rowIndex} {...(this.props.cells?.[rowIndex]?.[colIndex])} />;
                  })
                }
              </div>
            );
            })
          }
        </div>
      </div>
    );
  }
}
