import React from 'react';

import { Board } from '@app/board/board';
import { BoardExport } from '@app/board_export';
import { Controls } from '@app/controls';
import { NotesLayers } from '@app/notes/NotesLayers';
import { Difficulty } from '@app/types';
import { userStorage } from '@app/storage';
import { clearRelatedCandidates, fillCandidates, isBoardValid } from '@app/sudoku';
import { createBoard, type Board as SudokuBoard, type Cell as SudokuCell } from '@app/types/board';
import { NoteLayer } from '@app/types/notes';
import { getNewBoard, recomputeValidity } from '@app/game/boardState';
import { useResetApp } from '@app/hooks/useResetApp';
import { useRecognitionToast } from '@app/hooks/useRecognitionToast';
import { RecognitionToast } from '@app/RecognitionToast';
import { getHint } from '@app/hints';
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
  const hintTimeoutRef = React.useRef<number | null>(null);

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
    const cell = cells[row][col];
    const prev = cell.candidates ?? [];
    const next = prev.includes(num)
      ? prev.filter((c) => c !== num)
      : [...prev, num].sort((a, b) => a - b);
    const nextCells = createBoard((r, c) => {
      if (r === row && c === col) {
        return { ...cell, candidates: next };
      }
      return cells[r][c];
    });
    pushHistory(cells, layers);
    setCells(nextCells);
  };

  const handleDrawCandidates = () => {
    pushHistory(cells, layers);
    const filled = fillCandidates(
      createBoard((row, col) => ({ ...cells[row][col], candidates: undefined })),
    );
    setCells(
      createBoard((row, col) => ({
        ...cells[row][col],
        candidates: filled[row][col].candidates,
      })),
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
      return cells[nextRow][nextCol];
    });

    const cellsAfterCandidates =
      cellToStore.user && cellToStore.value !== undefined
        ? clearRelatedCandidates(nextCells, row, col)
        : nextCells;

    pushHistory(cells, layers);
    const validated = recomputeValidity(cellsAfterCandidates);
    setCells(validated);

    const allFilled = validated.every((rowArr) =>
      rowArr.every((cell) => cell.value !== undefined),
    );
    if (allFilled && isBoardValid(validated)) {
      victoryRef.current?.show();
    }
  };

  const handleNewPuzzle = (difficulty: Difficulty) => {
    setCells((prevCells) => {
      pushHistory(prevCells, layers);
      return getNewBoard(difficulty);
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
    if (hintTimeoutRef.current != null) {
      window.clearTimeout(hintTimeoutRef.current);
    }
    try {
      const { description } = getHint(cells);
      console.log('Hint:', description);
      setHintText(description);
      hintTimeoutRef.current = window.setTimeout(() => {
        setHintText(null);
        hintTimeoutRef.current = null;
      }, 6000);
    } catch (e) {
      console.error('getHint threw:', e);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center py-3 px-3">
      <div className="flex w-full max-w-3xl flex-col items-stretch gap-3">
        <main className="mt-0 flex flex-col items-center gap-2">
          <Controls
            ref={controlsRef}
            onNewPuzzle={handleNewPuzzle}
            onHint={handleHint}
            onDrawCandidates={handleDrawCandidates}
            onResetApp={handleResetApp}
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
          <DigitIndicatorRow
            digits={Array.from({ length: 9 }, (_, i) => {
              const digit = i + 1;
              let count = 0;
              cells.forEach((row) =>
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
            onStrokeWillBegin={() => {
              pushHistory(cells, layers);
            }}
          />
          <div className="w-full rounded-2xl bg-white/90 p-2 text-xs text-slate-800 shadow-sm ring-1 ring-slate-200">
            <BoardExport cells={cells} />
          </div>
          <div className="mt-1 text-[10px] text-white-500">
            Built {new Date(__APP_BUILD_TIME__).toLocaleString()} ({__APP_COMMIT__})
          </div>
        </main>
      </div>
      <RecognitionToast candidates={recognitionCandidates} />
      {hintText && (
        <div
          style={{
            position: 'fixed',
            top: 64,
            pointerEvents: 'none',
            border: '3px solid rgba(255, 255, 255, 0.9)',
            borderRadius: 16,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            fontSize: '0.8rem',
            padding: '2px 8px',
            maxWidth: '60vw',
            textAlign: 'center',
          }}
          className="fade-out"
        >
          {hintText}
        </div>
      )}
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
