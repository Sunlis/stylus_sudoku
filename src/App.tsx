import React from 'react';

import { Board } from '@app/board/board';
import { BoardExport } from '@app/board_export';
import { Controls } from '@app/controls';
import { NotesLayers } from '@app/notes/NotesLayers';
import { Difficulty } from '@app/types/difficulty';
import { userStorage } from '@app/storage';
import { clearRelatedCandidates, fillCandidates, isBoardValid } from '@app/sudoku';
import { createBoard, type Board as SudokuBoard, type Cell as SudokuCell } from '@app/types/board';
import { NoteLayer } from '@app/types/notes';
import { getNewBoard, recomputeValidity } from '@app/game/boardState';
import { useResetApp } from '@app/hooks/useResetApp';
import { useRecognitionToast } from '@app/hooks/useRecognitionToast';
import { RecognitionToast } from '@app/RecognitionToast';
import { getHint, MoveStrategy } from '@app/hints';
import { VictoryDialog } from './victory';
import { DigitIndicatorRow } from './game/digit_indicator';

function App() {
  const controlsRef = React.useRef<Controls | null>(null);
  const victoryRef = React.useRef<VictoryDialog | null>(null);
  const [cells, setCells] = React.useState<SudokuBoard>(() => {
    const stored = userStorage.getBoardState();
    if (stored) {
      return recomputeValidity(stored);
    }
    return recomputeValidity(getNewBoard(userStorage.getDifficulty()));
  });
  const [layers, setLayers] = React.useState<NoteLayer[]>(() => {
    const stored = userStorage.getNotesLayers<NoteLayer[]>();
    if (stored && Array.isArray(stored)) {
      return stored.map((layer) => ({ ...layer }));
    }
    return [];
  });

  type HistoryEntry = { cells: SudokuBoard; layers: NoteLayer[]; };
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);
  const [eraseMode, setEraseMode] = React.useState(false);
  const [highlightDigit, setHighlightDigit] = React.useState<number | null>(null);
  const { candidates: recognitionCandidates, showCandidates } = useRecognitionToast();
  const [hintText, setHintText] = React.useState<string | null>(null);
  const [isLandscape, setIsLandscape] = React.useState(
    () => window.matchMedia('(orientation: landscape)').matches
  );
  React.useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape)');
    const handler = (e: MediaQueryListEvent) => setIsLandscape(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const pushHistory = React.useCallback(
    (snapshotCells: SudokuBoard, snapshotLayers: NoteLayer[]) => {
      const MAX_HISTORY = 100;
      setHistory((prev) => {
        const updated = [...prev, { cells: snapshotCells, layers: snapshotLayers }];
        if (updated.length > MAX_HISTORY) {
          updated.shift();
        }
        return updated;
      });
    },
    [],
  );

  React.useEffect(() => {
    userStorage.setBoardState(cells);
  }, [cells]);

  React.useEffect(() => {
    userStorage.setNotesLayers(layers);
  }, [layers]);

  React.useEffect(() => {
    document.title = 'Stylus Sudoku';
  }, []);

  const handleToggleCandidate = (row: number, col: number, num: number) => {
    const cell = cells.grid[row][col];
    const prev = cell.candidates ?? [];
    const next = prev.includes(num)
      ? prev.filter((c) => c !== num)
      : [...prev, num].sort((a, b) => a - b);
    const nextCells = createBoard((r, c) => {
      if (r === row && c === col) {
        return { ...cell, candidates: next };
      }
      return cells.grid[r][c];
    }, cells.killerAreas);
    pushHistory(cells, layers);
    setCells(nextCells);
  };

  const handleDrawCandidates = () => {
    pushHistory(cells, layers);
    const filled = fillCandidates(
      createBoard((row, col) => ({ ...cells.grid[row][col], candidates: undefined }), cells.killerAreas),
    );
    setCells(
      createBoard((row, col) => ({
        ...cells.grid[row][col],
        candidates: filled.grid[row][col].candidates,
      }), cells.killerAreas),
    );
  };

  const handleChangeCell = (nextCell: SudokuCell) => {
    const { row, col } = nextCell;
    const cellToStore =
      nextCell.user && nextCell.value !== undefined
        ? { ...nextCell, candidates: undefined }
        : nextCell;
    const nextCells = createBoard((nextRow, nextCol) => {
      if (nextRow === row && nextCol === col) {
        return cellToStore;
      }
      return cells.grid[nextRow][nextCol];
    }, cells.killerAreas);

    const cellsAfterCandidates =
      cellToStore.user && cellToStore.value !== undefined
        ? clearRelatedCandidates(nextCells, row, col)
        : nextCells;

    pushHistory(cells, layers);
    const validated = recomputeValidity(cellsAfterCandidates);
    setCells(validated);

    const allFilled = validated.grid.every((rowArr) =>
      rowArr.every((cell) => cell.value !== undefined),
    );
    if (allFilled && isBoardValid(validated)) {
      victoryRef.current?.show();
    }
  };

  const handleNewPuzzle = (difficulty: Difficulty, killerMode: boolean = false) => {
    setCells((prevCells) => {
      pushHistory(prevCells, layers);
      return getNewBoard(difficulty, killerMode);
    });

    setLayers((prevLayers) =>
      prevLayers.map((layer) => ({
        ...layer,
        strokes: [],
        texts: layer.texts ? [] : layer.texts,
      })),
    );

    setHighlightDigit(null);

    setHistory([]);
  };

  const handleResetApp = useResetApp();

  const handleHint = () => {
    if (hintText !== null) {
      setHintText(null);
      return;
    }
    try {
      const { strategy, description, result } = getHint(cells);
      console.log(MoveStrategy[strategy], description, result);
      setHintText(description);
    } catch (e) {
      console.error('getHint threw:', e);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center py-3 px-3">
      <div className="flex w-full max-w-3xl landscape:max-w-5xl flex-col items-stretch gap-3">
        <main className="flex flex-col gap-2 landscape:gap-3">
          <div
            style={isLandscape
              ? { display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'start', gap: 12 }
              : { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
          >
            {/* Left column: all controls/sidebar items grouped together */}
            <div
              className="w-full flex flex-col items-center gap-2"
              style={isLandscape ? { gridColumn: 1, gridRow: 1 } : { display: 'contents' }}
            >
              <Controls
                ref={controlsRef}
                onNewPuzzle={handleNewPuzzle}
                onHint={handleHint}
                onDrawCandidates={handleDrawCandidates}
                onResetApp={handleResetApp}
                onCopyDebug={() => {
                  const overrides = cells.grid.flatMap((row) =>
                    row.flatMap((cell) => {
                      if (cell.value !== undefined) return [];
                      return [{
                        row: cell.row,
                        col: cell.col,
                        ...(cell.candidates?.length ? { candidates: cell.candidates } : {}),
                      }];
                    })
                  );
                  const json = JSON.stringify(overrides, null, 2);
                  const snippet = `solvedExcept(${json})`;
                  navigator.clipboard.writeText(snippet).catch(() => {
                    console.log('Board debug fixture:\n', snippet);
                  });
                }}
                onUndo={() => {
                  setHistory((prevHistory) => {
                    if (prevHistory.length === 0) {
                      return prevHistory;
                    }
                    const nextHistory = [...prevHistory];
                    const previous = nextHistory.pop()!;
                    setCells(previous.cells);
                    setLayers(previous.layers);
                    return nextHistory;
                  });
                }}
                canUndo={history.length > 0}
              />
              {hintText && (
                <div className="w-full rounded-2xl bg-white p-3 shadow-md ring-1 ring-slate-200">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-slate-800 leading-relaxed">{hintText}</p>
                    <button
                      className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      onClick={() => setHintText(null)}
                    >
                      Hide
                    </button>
                  </div>
                </div>
              )}
              {/* Board sits here in portrait (between controls and digit indicator) */}
              {!isLandscape && (
                <div className="flex justify-center">
                  <div className="rounded-2xl bg-white p-2 shadow-md ring-1 ring-slate-200">
                    <Board
                      cells={cells}
                      eraseMode={eraseMode}
                      highlightDigit={highlightDigit ?? undefined}
                      onChangeCell={handleChangeCell}
                      onToggleCandidate={handleToggleCandidate}
                      onRecognitionCandidates={(_row, _col, outcome) => {
                        showCandidates(outcome);
                      }}
                    />
                  </div>
                </div>
              )}
              <DigitIndicatorRow
                digits={Array.from({ length: 9 }, (_, i) => {
                  const digit = i + 1;
                  let count = 0;
                  cells.grid.forEach((row) =>
                    row.forEach((cell) => {
                      if (cell.value === digit) {
                        count += 1;
                      }
                    }),
                  );
                  return { digit, count: 9 - count };
                })}
                onTapDigit={(digit) => {
                  setHighlightDigit((prev) => (prev === digit ? null : digit));
                }}
              />
              <NotesLayers
                eraseMode={eraseMode}
                onToggleEraseMode={() => setEraseMode((prev) => !prev)}
                layers={layers}
                setLayers={(updater) => {
                  setLayers((prev) => updater(prev));
                }}
                highlightDigit={highlightDigit ?? undefined}
                isLandscape={isLandscape}
                hintVisible={hintText !== null}
                onStrokeWillBegin={() => {
                  pushHistory(cells, layers);
                }}
              />
              <div className="w-full rounded-2xl bg-white/90 p-2 text-xs text-slate-800 shadow-sm ring-1 ring-slate-200">
                <BoardExport cells={cells} />
              </div>
              <div className="mt-1 text-center text-[10px] text-white-500">
                Built {new Date(__APP_BUILD_TIME__).toLocaleString()} ({__APP_COMMIT__})
              </div>
            </div>
            {/* Board in landscape: column 2, single row */}
            {isLandscape && (
              <div
                className="flex justify-center"
                style={{ gridColumn: 2, gridRow: 1 }}
              >
                <div className="rounded-2xl bg-white p-2 shadow-md ring-1 ring-slate-200">
                  <Board
                    cells={cells}
                    eraseMode={eraseMode}
                    highlightDigit={highlightDigit ?? undefined}
                    onChangeCell={handleChangeCell}
                    onToggleCandidate={handleToggleCandidate}
                    onRecognitionCandidates={(_row, _col, outcome) => {
                      showCandidates(outcome);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      <RecognitionToast candidates={recognitionCandidates} />
      <VictoryDialog
        ref={victoryRef}
        onNewGame={() => {
          controlsRef.current?.openNewGameDialog();
        }}
      />
    </div>
  );
}

export default App;
