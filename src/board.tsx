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

export interface CellContents {
  value?: number;
  candidates?: number[];
  valid?: boolean;
  user?: boolean;
}

export interface CellProps extends CellContents {
  column: number;
  row: number;
  onClick: () => void;
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
          width: '10vw',
          height: '10vw',
          backgroundColor: bg,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color,
          fontWeight: weight,
          fontSize,
        }}
        onClick={() => {
          if (this.props.user) {
            this.props.onClick();
          }
        }}>
        {interior}
      </div>
    );
  }
}

interface BoardProps {
  cells: CellContents[][];
  onChangeCell: (row: number, column: number, contents: CellContents) => void;
}

interface BoardState {
  focusedCell?: {
    row: number;
    column: number;
  };
}

export class Board extends React.Component<BoardProps, BoardState> {
  dialogRef: React.RefObject<HTMLDialogElement> = React.createRef();

  constructor(props: BoardProps) {
    super(props);
    this.state = {
      focusedCell: undefined,
    };
  }

  render() {
    const inputButton = (num: number) => {
      return (
        <button
          key={num}
          style={{
            width: '4rem',
            height: '4rem',
          }}
          onClick={() => {
            if (this.state.focusedCell) {
              const { row, column } = this.state.focusedCell;
              const newContents: CellContents = {
                ...this.props.cells[row][column],
                value: num,
                user: true,
              };
              this.props.onChangeCell(row, column, newContents);
            }
            this.dialogRef.current?.close();
          }}>
          {num}
        </button>
      );
    };
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
                    return <Cell
                      key={colIndex}
                      column={colIndex}
                      row={rowIndex}
                      onClick={() => {
                        this.setState({ focusedCell: { row: rowIndex, column: colIndex } });
                        this.dialogRef.current?.showModal();
                      }}
                      {...(this.props.cells?.[rowIndex]?.[colIndex])} />;
                  })
                }
              </div>
            );
            })
          }
        </div>
        <dialog
          style={{
            // marginTop: '65vh',
          }}
          ref={this.dialogRef}>
          <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.1rem',
            }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                alignItems: 'center',
              }}>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
                  {inputButton(1)}
                  {inputButton(2)}
                  {inputButton(3)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
                  {inputButton(4)}
                  {inputButton(5)}
                  {inputButton(6)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
                  {inputButton(7)}
                  {inputButton(8)}
                  {inputButton(9)}
                </div>
                <button style={{ width: '6rem', height: '2.5rem', marginTop: '2rem' }} onClick={() => {
                  if (this.state.focusedCell) {
                    const { row, column } = this.state.focusedCell;
                    const newContents: CellContents = {
                      ...this.props.cells[row][column],
                      value: undefined,
                    };
                    this.props.onChangeCell(row, column, newContents);
                  }
                  this.dialogRef.current?.close();
                }}>Clear</button>
              </div>
            <button style={{ marginTop: '2rem', width: '6rem', height: '2.5rem' }} onClick={() => {
              this.dialogRef.current?.close();
            }}>Close</button>
          </div>
        </dialog>
      </div>
    );
  }
}
