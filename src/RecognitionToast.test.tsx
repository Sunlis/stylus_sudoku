import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { RecognitionToast } from './RecognitionToast';

describe('RecognitionToast', () => {
  it('renders nothing when candidates is null', () => {
    const { container } = render(<RecognitionToast candidates={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the toast container when candidates are present', () => {
    render(<RecognitionToast candidates={{ local: ['3'], remote: ['3'] }} />);
    expect(screen.getByText('Recognition candidates')).toBeInTheDocument();
  });

  it('renders local candidates when provided', () => {
    render(<RecognitionToast candidates={{ local: ['3', '8', '9'] }} />);
    expect(screen.getByText('3, 8, 9')).toBeInTheDocument();
  });

  it('renders remote candidates when provided', () => {
    render(<RecognitionToast candidates={{ remote: ['7', '1'] }} />);
    expect(screen.getByText('7, 1')).toBeInTheDocument();
  });

  it('does not render local section when local is absent', () => {
    const { container } = render(<RecognitionToast candidates={{ remote: ['5'] }} />);
    expect(container.textContent).not.toContain('Local:');
  });

  it('does not render remote section when remote is absent', () => {
    const { container } = render(<RecognitionToast candidates={{ local: ['5'] }} />);
    expect(container.textContent).not.toContain('Remote:');
  });

  it('does not render local section when local is an empty array', () => {
    const { container } = render(<RecognitionToast candidates={{ local: [], remote: ['5'] }} />);
    expect(container.textContent).not.toContain('Local:');
  });

  it('renders both local and remote sections when both are present', () => {
    const { container } = render(<RecognitionToast candidates={{ local: ['3'], remote: ['3', '8'] }} />);
    expect(container.textContent).toContain('Local:');
    expect(container.textContent).toContain('Remote:');
  });
});
