import React from 'react';

class CandidateCell extends React.Component<{ number: number; visible: boolean }> {
  render() {
    return (
      <div style={{ flex: '1', textAlign: 'center', width: '3vw', height: '3vw' }}>
        {this.props.visible ? this.props.number : ' '}
      </div>
    );
  }
}

export interface CellProps {
  value?: number;
  candidates?: number[];
  valid?: boolean;
  user?: boolean;
}

class Cell extends React.Component<CellProps> {
  render() {
    let interior = <div></div>;
    if (this.props.value !== undefined) {
      interior = <div>{this.props.value}</div>;
    } else if (this.props.candidates !== undefined) {
      interior = (
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.1em' }}>
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
    return (
      <div style={{
          border: '1px solid black',
          borderRight: 'none',
          borderBottom: 'none',
          boxSizing: 'border-box',
          width: '9vw',
          height: '9vw',
          backgroundColor: this.props.valid === false ? '#ffcccc' : 'unset',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontWeight: this.props.user ? 'normal' : 'bold',
        }}>
        {interior}
      </div>
    );
  }
}

export interface BoardProps {
  cells: CellProps[][];
}

export class Board extends React.Component<BoardProps> {
  render() {
    return (
      <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center' }}>
        <div style={{
          border: '1px solid black',
          borderLeft: 'none',
          borderTop: 'none',
          boxSizing: 'border-box',
        }}>
          {
            Array.from({ length: 9 }, (_, rowIndex) => {
              return (<div key={rowIndex} style={{ display: 'flex', flexDirection: 'row' }}>
                {
                  Array.from({ length: 9 }, (_, colIndex) => {
                    return <Cell key={colIndex} {...(this.props.cells?.[rowIndex]?.[colIndex])} />;
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
