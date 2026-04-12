import { Button } from "@heroui/react";
import React from "react";
import { DIALOG_STYLE, PRIMARY_BUTTON, SECONDARY_BUTTON } from "./style";
import { broadcast, Signal, subscribe } from "./signals";

interface SettingsProps {
  onOpenChange?: (open: boolean) => void;
}

interface SettingsState {
}

export class SettingsDialog extends React.Component<SettingsProps, SettingsState> {
  ref: React.RefObject<HTMLDialogElement> = React.createRef();

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
          <h2>Settings</h2>
          <div>
          </div>
        </div>
      </dialog>
    );
  }
}

interface SettingsButtonProps {
  onPress: () => void;
}

export class SettingsButton extends React.Component<SettingsButtonProps> {
  dialogRef: React.RefObject<SettingsDialog> = React.createRef();

  render() {
    return (
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Button
          className={SECONDARY_BUTTON}
          color="primary"
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
