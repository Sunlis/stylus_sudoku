import React from 'react';

interface SwitchProps {
  isSelected: boolean;
  onToggle: () => void;
  iconOn: React.ReactNode;
  iconOff: React.ReactNode;
  ariaLabel?: string;
  title?: string;
  trackColorOn?: string;
  trackColorOff?: string;
  thumbColorOn?: string;
  thumbColorOff?: string;
  thumbIconColorOn?: string;
  thumbIconColorOff?: string;
}

export class Switch extends React.Component<SwitchProps> {
  render() {
    const {
      isSelected, onToggle, iconOn, iconOff, ariaLabel, title,
      trackColorOn = '#1e293b',
      trackColorOff = '#cbd5e1',
      thumbColorOn = '#ffffff',
      thumbColorOff = '#ffffff',
      thumbIconColorOn = '#000000',
      thumbIconColorOff = '#000000',
    } = this.props;

    const trackClass = [
      'relative',
      'h-8',
      'w-16',
      'rounded-full',
      'transition-colors',
      'duration-200',
    ].join(' ');

    const thumbClass = [
      'absolute',
      'top-1',
      'flex',
      'h-6',
      'w-6',
      'items-center',
      'justify-center',
      'rounded-full',
      'shadow',
      'transition-all',
      'duration-200',
      isSelected ? 'translate-x-8' : 'translate-x-1',
    ].join(' ');

    return (
      <label
        aria-label={ariaLabel}
        title={title}
        className="relative inline-flex cursor-pointer items-center"
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={isSelected}
          onChange={onToggle}
        />
        <div
          className={trackClass}
          style={{ backgroundColor: isSelected ? trackColorOn : trackColorOff }}
        >
          <div
            className={thumbClass}
            style={{ backgroundColor: isSelected ? thumbColorOn : thumbColorOff }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '1rem',
                height: '1rem',
                color: isSelected ? thumbIconColorOn : thumbIconColorOff,
              }}
            >
              {isSelected ? iconOn : iconOff}
            </span>
          </div>
        </div>
      </label>
    );
  }
}
