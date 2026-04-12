import React from "react";

type Color = {
  r: number;
  g: number;
  b: number;
  a: number;
};

function parseColor(input: string): Color | null {
  if (input.startsWith('#')) {
    const hex = input.slice(1);
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b, a: 1 };
    } else if (hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = parseInt(hex.slice(6, 8), 16) / 255;
      return { r, g, b, a };
    }
  } else if (input.startsWith('rgba(') && input.endsWith(')')) {
    const parts = input.slice(5, -1).split(',').map(s => s.trim());
    if (parts.length === 4) {
      const r = parseInt(parts[0]);
      const g = parseInt(parts[1]);
      const b = parseInt(parts[2]);
      const a = parseFloat(parts[3]);
      return { r, g, b, a };
    }
  } else if (input.startsWith('rgb(') && input.endsWith(')')) {
    const parts = input.slice(4, -1).split(',').map(s => s.trim());
    if (parts.length === 3) {
      const r = parseInt(parts[0]);
      const g = parseInt(parts[1]);
      const b = parseInt(parts[2]);
      return { r, g, b, a: 1 };
    }
  }
  return null;
}

function colorToString(color: Color): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
}

function stripAlpha(color: Color): Color {
  return { r: color.r, g: color.g, b: color.b, a: 1 };
}

interface ColorPreviewProps {
  color: Color;
  style?: React.CSSProperties;
  innerStyle?: React.CSSProperties;
}

export class ColorPreview extends React.Component<ColorPreviewProps> {
  render(): React.JSX.Element {
    return (
      <div style={{
        background: 'repeating-conic-gradient(#fff 0 25%, #aaa 0 50%) 50% / 20px 20px',
        width: '3rem',
        height: '3rem',
        borderRadius: '9rem',
        display: 'inline-block',
        ...this.props.style,
      }}>
        <div style={{
          backgroundColor: colorToString(this.props.color),
          width: '100%',
          height: '100%',
          borderRadius: '2rem',
          ...this.props.innerStyle,
        }}></div>
      </div>
    );
  }
}

interface ColorSelectProps {
  defaultValue: Color | string;
  onChange?: (str: string, color: Color) => void;
}

interface ColorSelectState {
  value: Color;
}

const LABEL_STYLE: React.CSSProperties = {
  color: 'rgba(0, 0, 0, 0.7)',
  fontSize: '0.8rem',
  marginLeft: '2px',
  fontStyle: 'italic',
};

export class ColorSelect extends React.Component<ColorSelectProps, ColorSelectState> {
  defaultValue: Color;

  constructor(props: ColorSelectProps) {
    super(props);
    if (typeof props.defaultValue === 'string') {
      const parsed = parseColor(props.defaultValue);
      this.defaultValue = parsed ?? { r: 0, g: 0, b: 0, a: 1 };
    } else {
      this.defaultValue = props.defaultValue;
    }
    this.state = {
      value: this.defaultValue,
    };
  }

  render(): React.JSX.Element {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
      }}>
        <ColorPreview color={this.state.value} style={{
          marginRight: '1rem',
          alignSelf: 'center',
        }} />
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          marginRight: '1rem',
        }}>
          <label style={LABEL_STYLE}>Color</label>
          <input
            type="color"
            style={{
              height: '2rem',
            }}
            defaultValue={colorToString(stripAlpha(this.defaultValue))}
            onChange={(event) => {
              const color = parseColor(event.target.value) ?? this.state.value;
              this.setState({
                value: {
                  r: color.r,
                  g: color.g,
                  b: color.b,
                  a: this.state.value.a,
                }
              });
              this.props.onChange?.(colorToString(color), color);
            }} />
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}>
          <label style={LABEL_STYLE}>Opacity</label>
          <input
            type="range"
            style={{
              height: '2rem',
            }}
            min="0"
            max="1"
            step="0.01"
            onChange={(event) => {
              this.setState({
                value: {
                  ...this.state.value,
                  a: parseFloat(event.target.value),
                }
              });
            }}
            defaultValue={this.state.value.a} />
        </div>
      </div>
    );
  }
}