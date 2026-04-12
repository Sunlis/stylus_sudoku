import { Button, ColorArea, ColorPicker, ColorSlider, ColorSwatch, Label } from "@heroui/react";
import React from "react";
import { DIALOG_STYLE, PRIMARY_BUTTON, SECONDARY_BUTTON } from "./style";
import { broadcast, Signal, subscribe } from "./signals";
import { ColorSelect } from "./settings/color_picker";

interface SettingsProps {
  onOpenChange?: (open: boolean) => void;
}

interface SettingsState {
}

export class SettingsDialog extends React.Component<SettingsProps, SettingsState> {
  ref: React.RefObject<HTMLDialogElement | null> = React.createRef();

  constructor(props: SettingsProps) {
    super(props);
    this.state = {
    };
    subscribe(Signal.SHOW_SETTINGS, () => {
      this.show();
    });
  }

  show() {
    this.ref.current?.showModal();
    this.props.onOpenChange?.(true);
  }

  hide() {
    this.ref.current?.close();
    this.props.onOpenChange?.(false);
  }

  render() {
    return (
      <dialog ref={this.ref} style={DIALOG_STYLE}>
        <div style={{
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <h1>Settings</h1>
          <div>
            <h2>Pre-filled cell border</h2>
            <ColorSelect defaultValue="rgba(33, 21, 4, 0.2)" onChange={(color) => {
              console.log('color changed', color);
            }} />
          </div>
          <hr />
          <div>
            <h2>User-filled cell border</h2>
            <ColorSelect defaultValue="rgba(72, 150, 134, 0.3)" onChange={(color) => {
              console.log('color changed', color);
            }} />
          </div>
          <Button
            className={PRIMARY_BUTTON}
            style={{
              marginTop: '2rem',
            }}
            onPress={() => {
              this.hide();
            }}
          >
            Close
          </Button>
        </div>
      </dialog>
    );
  }
}

interface SettingsButtonProps {
  onPress: () => void;
}

export class SettingsButton extends React.Component<SettingsButtonProps> {
  dialogRef: React.RefObject<SettingsDialog | null> = React.createRef();

  render() {
    return (
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Button
          className={SECONDARY_BUTTON}
          onPress={() => {
            this.props.onPress();
            broadcast(Signal.SHOW_SETTINGS);
          }}
        >
          Settings
        </Button>
      </div>
    );
  }
}
