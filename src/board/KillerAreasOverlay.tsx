import React from 'react';

import type { KillerArea } from '@app/types/board';

interface Props {
  killerAreas: KillerArea[];
}

export class KillerAreasOverlay extends React.Component<Props> {
  private canvasRef = React.createRef<HTMLCanvasElement>();
  private resizeObserver: ResizeObserver | null = null;

  componentDidMount(): void {
    this.draw();
    if (this.canvasRef.current) {
      this.resizeObserver = new ResizeObserver(() => this.draw());
      this.resizeObserver.observe(this.canvasRef.current);
    }
  }

  componentDidUpdate(): void {
    this.draw();
  }

  componentWillUnmount(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  private draw(): void {
    const canvas = this.canvasRef.current;
    if (!canvas) {
      return;
    }

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { killerAreas } = this.props;
    if (killerAreas.length === 0) {
      return;
    }

    // Query actual cell DOM positions so drawing aligns pixel-perfectly regardless
    // of border widths. `.sudoku-cell` elements are ordered row-major (row 0 first).
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;

    type CellBounds = { x0: number; y0: number; x1: number; y1: number; };
    const cellBounds: (CellBounds | null)[][] = Array.from({ length: 9 }, () => Array(9).fill(null));

    document.querySelectorAll('.sudoku-cell').forEach((el, i) => {
      const row = Math.floor(i / 9);
      const col = i % 9;
      const rect = el.getBoundingClientRect();
      cellBounds[row][col] = {
        x0: (rect.left - canvasRect.left) * scaleX,
        y0: (rect.top - canvasRect.top) * scaleY,
        x1: (rect.right - canvasRect.left) * scaleX,
        y1: (rect.bottom - canvasRect.top) * scaleY,
      };
    });

    const approxCellW = canvas.width / 9; // used only for font sizing
    const approxCellH = canvas.height / 9;

    const getBounds = (row: number, col: number): CellBounds =>
      cellBounds[row][col] ?? {
        x0: col * approxCellW,
        y0: row * approxCellH,
        x1: (col + 1) * approxCellW,
        y1: (row + 1) * approxCellH,
      };

    // Build map from "row,col" → area index
    const areaMap = new Map<string, number>();
    killerAreas.forEach((area, i) => {
      area.cells.forEach((cell) => areaMap.set(`${cell.row},${cell.col}`, i));
    });

    // Draw dotted boundary segments inset inside each cell on sides facing a different area.
    // At each end of a segment, only apply the corner inset if the neighbor along the line
    // direction is a different area — if it's the same area the line extends to the full
    // corner so adjacent same-group cells connect seamlessly.
    const INSET = 5;

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 8]);

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const areaIdx = areaMap.get(`${row},${col}`);
        const same = (r: number, c: number): boolean => areaMap.get(`${r},${c}`) === areaIdx;
        const { x0, y0, x1, y1 } = getBounds(row, col);

        // top edge — inset line at y0+INSET
        if (row > 0 && areaMap.get(`${row - 1},${col}`) !== areaIdx) {
          const lx = x0 + (col > 0 && same(row, col - 1) ? 0 : INSET);
          const rx = x1 - (col < 8 && same(row, col + 1) ? 0 : INSET);
          ctx.beginPath();
          ctx.moveTo(lx, y0 + INSET);
          ctx.lineTo(rx, y0 + INSET);
          ctx.stroke();
        }

        // bottom edge — inset line at y1-INSET
        if (row < 8 && areaMap.get(`${row + 1},${col}`) !== areaIdx) {
          const lx = x0 + (col > 0 && same(row, col - 1) ? 0 : INSET);
          const rx = x1 - (col < 8 && same(row, col + 1) ? 0 : INSET);
          ctx.beginPath();
          ctx.moveTo(lx, y1 - INSET);
          ctx.lineTo(rx, y1 - INSET);
          ctx.stroke();
        }

        // left edge — inset line at x0+INSET
        if (col > 0 && areaMap.get(`${row},${col - 1}`) !== areaIdx) {
          const ty = y0 + (row > 0 && same(row - 1, col) ? 0 : INSET);
          const by = y1 - (row < 8 && same(row + 1, col) ? 0 : INSET);
          ctx.beginPath();
          ctx.moveTo(x0 + INSET, ty);
          ctx.lineTo(x0 + INSET, by);
          ctx.stroke();
        }

        // right edge — inset line at x1-INSET
        if (col < 8 && areaMap.get(`${row},${col + 1}`) !== areaIdx) {
          const ty = y0 + (row > 0 && same(row - 1, col) ? 0 : INSET);
          const by = y1 - (row < 8 && same(row + 1, col) ? 0 : INSET);
          ctx.beginPath();
          ctx.moveTo(x1 - INSET, ty);
          ctx.lineTo(x1 - INSET, by);
          ctx.stroke();
        }

        // Inside corner brackets: drawn at concave corners where this cell has same-area
        // neighbors on two perpendicular sides but the diagonal is a different area.
        // Each bracket is an L-shape connecting the endpoints of the adjacent boundary lines.

        // top-left inside corner
        if (row > 0 && col > 0 && same(row - 1, col) && same(row, col - 1) && !same(row - 1, col - 1)) {
          ctx.beginPath(); ctx.moveTo(x0 + INSET, y0); ctx.lineTo(x0 + INSET, y0 + INSET); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x0, y0 + INSET); ctx.lineTo(x0 + INSET, y0 + INSET); ctx.stroke();
        }

        // top-right inside corner
        if (row > 0 && col < 8 && same(row - 1, col) && same(row, col + 1) && !same(row - 1, col + 1)) {
          ctx.beginPath(); ctx.moveTo(x1 - INSET, y0); ctx.lineTo(x1 - INSET, y0 + INSET); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x1 - INSET, y0 + INSET); ctx.lineTo(x1, y0 + INSET); ctx.stroke();
        }

        // bottom-left inside corner
        if (row < 8 && col > 0 && same(row + 1, col) && same(row, col - 1) && !same(row + 1, col - 1)) {
          ctx.beginPath(); ctx.moveTo(x0, y1 - INSET); ctx.lineTo(x0 + INSET, y1 - INSET); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x0 + INSET, y1 - INSET); ctx.lineTo(x0 + INSET, y1); ctx.stroke();
        }

        // bottom-right inside corner
        if (row < 8 && col < 8 && same(row + 1, col) && same(row, col + 1) && !same(row + 1, col + 1)) {
          ctx.beginPath(); ctx.moveTo(x1 - INSET, y1 - INSET); ctx.lineTo(x1, y1 - INSET); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x1 - INSET, y1 - INSET); ctx.lineTo(x1 - INSET, y1); ctx.stroke();
        }
      }
    }

    // Draw each area's sum in the top-left corner of its top-leftmost cell
    ctx.setLineDash([]);
    const fontSize = Math.round(approxCellW * 0.22);
    ctx.font = `bold ${fontSize}px sans-serif`;

    killerAreas.forEach((area) => {
      const topLeft = area.cells.reduce((min, c) => {
        if (c.row < min.row || (c.row === min.row && c.col < min.col)) {
          return c;
        }
        return min;
      });
      const { x0: cx0, y0: cy0, y1: cy1 } = getBounds(topLeft.row, topLeft.col);
      const cellHeight = cy1 - cy0;
      const x = cx0 + 2;
      const y = cy0 + cellHeight * 0.28;
      const label = String(area.sum);
      const metrics = ctx.measureText(label);
      const pad = 4;
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillRect(
        x - pad,
        y - fontSize - pad,
        metrics.width + pad * 2,
        fontSize + pad,
      );
      ctx.fillStyle = 'rgba(50, 50, 50, 0.85)';
      ctx.fillText(label, x, y - pad);
    });
  }

  render(): JSX.Element {
    return (
      <canvas
        ref={this.canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />
    );
  }
}
