import React from 'react';

type DigitProps = {
  digit: number;
  count: number;
};

export class DigitIndicator extends React.Component<DigitProps, {}> {
  render() {
    const { digit, count } = this.props;
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          color: '#000',
          opacity: count > 0 ? 1 : 0.6,
          position: 'relative',
          width: '9vw',
          height: '6vw',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
        }}
        className="rounded-xl p-2 shadow-md"
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
  digits: DigitProps[];
};

export class DigitIndicatorRow extends React.Component<DigitRowProps, {}> {
  render() {
    return (
      <div style={{
        display: 'flex',
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}>
        {this.props.digits.map((props) => <DigitIndicator key={props.digit} {...props} />)}
      </div>
    );
  }
}
