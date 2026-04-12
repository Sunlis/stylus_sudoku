import React from "react";
import { Color, colorToString, parseColor, stripAlpha } from "../colour";

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
  onChange?: (color: Color) => void;
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
              color.a = this.state.value.a;
              this.setState({
                value: color,
              });
              this.props.onChange?.(color);
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
              const color = {
                ...this.state.value,
                a: parseFloat(event.target.value),
              };
              this.setState({
                value: color,
              });
              this.props.onChange?.(color);
            }}
            defaultValue={this.state.value.a} />
        </div>
      </div>
    );
  }
}