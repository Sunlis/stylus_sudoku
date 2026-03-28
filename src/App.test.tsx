import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the Stylus Sudoku heading', () => {
    render(<App />);
    expect(document.title).toBe('Stylus Sudoku');
  });
});
