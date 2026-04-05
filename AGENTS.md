# Codebase Navigation Guide

Stylus Sudoku — a PWA sudoku app with handwriting recognition and freehand annotation layers.

## Tech Stack

- **React** (class components throughout, except `App.tsx` which is a function component)
- **TypeScript**
- **Tailwind CSS v4** (with `landscape:` variant; JS-driven layout uses inline `style` objects)
- **Vite** build, **Vitest** tests
- **TensorFlow.js** local CNN model for digit recognition fallback

## Key Files

| File | Purpose |
|---|---|
| `src/App.tsx` | Root function component. Owns all state: `cells`, `isLandscape`, `hintText`, history stack. Wires all callbacks. |
| `src/board/board.tsx` | Board class component. Renders 9×9 grid, dispatches cell changes up. |
| `src/board/cell.tsx` | Cell class component. Renders digit or `CandidateGrid` (pencil marks). Hosts `InputPanel`. |
| `src/input_panel.tsx` | Pointer-event canvas overlaid on each editable cell. Handles drawing → recognition pipeline. |
| `src/handwriting.ts` | `recognize()` — runs local CNN and remote Google HWR in parallel, merges results. |
| `src/local_recognizer.ts` | TensorFlow.js model wrapper for on-device digit recognition. |
| `src/sudoku.ts` | Core sudoku logic: validity checking, candidate computation. |
| `src/hints.ts` | Hint strategy engine. `getHint(cells)` returns the next logical move. |
| `src/controls.tsx` | Toolbar: pencil/eraser toggle, Hint button, overflow menu with debug actions. |
| `src/storage.ts` | `userStorage` — localStorage wrapper for preferences, handwriting traces. |
| `src/style.ts` | Shared style helpers/constants. |
| `src/types/board.ts` | Core types: `Cell`, `CellContents`, `Board`. |
| `src/types/notes.ts` | Types for annotation layer state. |

## Notes / Annotation Layers

| File | Purpose |
|---|---|
| `src/notes/NotesLayers.tsx` | Class component owning layer state (`NoteLayer[]`). Renders `NotesLayersOverlay`. |
| `src/notes/NotesLayersOverlay.tsx` | `position: fixed` overlay that tracks `#sudoku-board-root` via `ResizeObserver`. Renders `LayerCanvas` per layer. |
| `src/notes/LayerCanvas.tsx` | Per-layer pointer-event canvas. Handles stroke drawing/erasing, calls up via `onBeginStroke`/`onContinueStroke`. |

## Layout

- **Portrait**: flex-col — Controls → HintCard (conditional) → Board → DigitIndicator
- **Landscape**: CSS grid, 2 columns — Col 1: Controls + HintCard + DigitIndicator; Col 2: Board
- `isLandscape` state from `window.matchMedia('(orientation: landscape)')` drives which layout renders
- **Single Board DOM instance**: `{!isLandscape && <Board>}` in portrait position, `{isLandscape && <Board>}` in landscape col 2. Ensures `getElementById('sudoku-board-root')` always finds the right element.

## Cell Types Glossary

- `Cell.value` — confirmed digit (1–9), `undefined` = empty
- `Cell.candidates` — pencil marks (small 1–9 grid shown in empty cells)
- `Cell.user` — `true` if user-entered, `false`/`undefined` if puzzle clue (clues are read-only)
- `RecognitionOutcome.candidates` — ordered recognition guesses from HWR (separate concept)

## Input Pipeline

```
PointerDown/Move/Up on InputPanel canvas
  → pointerStart / pointerMove / pointerEnd
  → draw on canvas + TraceBuilder.addPoint()
  → on lift: setTimeout(recognize, delay)
  → recognize(): run local CNN + remote API in parallel
  → onNumberRecognized(n)   → Cell → Board → App.handleChangeCell → setCells()
  → onClearCell()           → clears digit
  → onTap(pos)              → onToggleCandidate → App.handleToggleCandidate (pencil marks)
  → onCandidatesRecognized  → RecognitionToast (4s display of recognition candidates)
```

Notes overlay input goes through `LayerCanvas` (pointer events) → `NotesLayers.beginStroke/continueStroke` → `setLayers()`.

## Hint System (`src/hints.ts`)

Strategies in priority order (enum `MoveStrategy`):
1. `NAKED_SINGLE` — only one candidate in a cell
2. `HIDDEN_SINGLE` — candidate appears once in a row/col/box
3. `NAKED_PAIR` / `NAKED_TRIPLE`
4. `HIDDEN_PAIR` / `HIDDEN_TRIPLE`
5. `LOCKED_CANDIDATES` — pointing (box→line) or box-line reduction (line→box)
6. `Y_WING`

`getHint(cells)` throws if no hint found (puzzle already solved or no strategy applies).
Hint card is toggled by pressing the Hint button in `Controls`; `hintVisible` prop propagates to `NotesLayersOverlay` to trigger re-measurement.

## Notes Overlay Position Tracking

`NotesLayersOverlay` must re-measure `#sudoku-board-root`'s bounding rect whenever the board moves. Triggers:
- `ResizeObserver` on `#sudoku-board-root` — fires on board resize
- `componentDidUpdate` with `requestAnimationFrame` deferred `updateBoardRect()` — fires when `isLandscape` or `hintVisible` props change (board moves without resizing)

## Tests

```bash
npm run test        # watch mode
npm run test -- --run  # single run
```

Test files sit next to source (`*.test.ts`/`*.test.tsx`). Test setup is in `src/test/setup.ts` — stubs `window.matchMedia` and `ResizeObserver`.

## Common Commands

```bash
npm run dev    # dev server
npm run build  # production build
npm run test   # vitest watch
```

## Style & Development

- Prefer classes over functions for React components.
- Never use single-line ifs (ie. always include curly braces).
- Prefer test-driven development whenever possible.
- Prefer regular CSS over Tailwind classes.

