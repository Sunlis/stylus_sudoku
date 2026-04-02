import React from 'react';

type Digit = {
  digit: number;
  count: number;
};

type DigitProps = Digit & {
  onClick?: () => void;
  selected?: boolean;
};

export class DigitIndicator extends React.Component<DigitProps, {}> {
  render() {
    const { digit, count, selected } = this.props;
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          color: '#000',
          opacity: count > 0 ? 1 : 0.4,
          position: 'relative',
          width: '9vw',
          height: '6vw',
          backgroundColor: selected ? 'rgba(164, 185, 231, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        }}
        className="rounded-xl p-2 shadow-md"
        onClick={this.props.onClick}
      >
        <div
          style={{
            margin: 0,
            padding: 0,
            fontSize: '0.8rem',
          }}
        >
          {digit}
        </div>
        <div
          style={{
            right: 6,
            bottom: 0,
            position: 'absolute',
            color: 'rgba(0, 0, 0, 0.6)',
          }}
        >
          {count}
        </div>
      </div>
    );
  }
}

type DigitRowProps = {
  digits: Digit[];
  onTapDigit?: (digit: number) => void;
};

type DigitState = {
  selected: number;
};

export class DigitIndicatorRow extends React.Component<DigitRowProps, DigitState> {

  constructor(props: DigitRowProps) {
    super(props);
    this.state = {
      selected: 0,
    };
  }

  handleTapDigit(digit: number) {
    this.setState((prev) => ({ selected: prev.selected === digit ? 0 : digit }));
    if (this.props.onTapDigit) {
      this.props.onTapDigit(digit);
    }
  }

  render() {
    return (
      <div style={{
        display: 'flex',
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}>
        {this.props.digits.map((props) => (
          <DigitIndicator
            key={props.digit}
            {...props}
            selected={this.state.selected === props.digit}
            onClick={() => this.handleTapDigit(props.digit)}
          />
        ))}
      </div>
    );
  }
}
