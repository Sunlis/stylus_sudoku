import { Button, ColorArea, ColorPicker, ColorSlider, ColorSwatch, Label } from "@heroui/react";
import React from "react";
import { DIALOG_STYLE, PRIMARY_BUTTON, SECONDARY_BUTTON } from "./style";
import { broadcast, Signal, subscribe } from "./signals";
import { ColorSelect } from "./settings/color_picker";
import { Theme, userStorage } from "./storage";
import { colorToString } from "./colour";

interface SettingsProps {
  onOpenChange?: (open: boolean) => void;
}

interface SettingsState {
}

const COLOR_SETTINGS: { label: string; themeKey: keyof Theme; }[] = [
  {
    label: 'Pre-filled cell border',
    themeKey: 'fixedCellBackground',
  },
  {
    label: 'User-filled cell border',
    themeKey: 'userCellBackground',
  },
  {
    label: 'Pre-filled cell highlight',
    themeKey: 'fixedHighlightBackground',
  },
  {
    label: 'User-filled cell highlight',
    themeKey: 'userHighlightBackground',
  },
  {
    label: 'Invalid cell background',
    themeKey: 'invalidCellBackground',
  },
  {
    label: 'Cell text color',
    themeKey: 'cellTextColor',
  },
  {
    label: 'Candidate text color',
    themeKey: 'candidateTextColor',
  },
];

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
      <dialog ref={this.ref} style={{
        ...DIALOG_STYLE,
        bottom: '-25vh',
        top: 'unset',
      }}>
        <div style={{
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <h1>Settings</h1>
          <div style={{
            overflowY: 'scroll',
            maxHeight: '40vh',
          }}>
            {
              COLOR_SETTINGS.map(({ label, themeKey }, index, arr) => (
                <div key={themeKey}>
                  <h2>{label}</h2>
                  <ColorSelect
                    defaultValue={colorToString(userStorage.getTheme()[themeKey])}
                    onChange={(color) => {
                      userStorage.updateTheme({ [themeKey]: color });
                    }} />
                  {(index < arr.length - 1) && <hr />}
                </div>
              ))
            }
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
