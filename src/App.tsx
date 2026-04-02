import React from 'react';

import { Board } from '@app/board/board';
import { BoardExport } from '@app/board_export';
import { Controls } from '@app/controls';
import { NotesLayers } from '@app/notes/NotesLayers';
import { Difficulty } from '@app/types';
import { userStorage } from '@app/storage';
import { fillCandidates, isBoardValid } from '@app/sudoku';
import { CellContents } from '@app/types/board';
import { NoteLayer, NoteText } from '@app/types/notes';
import { getNewBoard, recomputeValidity } from '@app/game/boardState';
import { useResetApp } from '@app/hooks/useResetApp';
import { useRecognitionToast } from '@app/hooks/useRecognitionToast';
import { RecognitionToast } from '@app/RecognitionToast';
import { VictoryDialog } from './victory';
import { DigitIndicatorRow } from './game/digit_indicator';

function App() {
  const controlsRef = React.useRef<Controls | null>(null);
  const victoryRef = React.useRef<VictoryDialog | null>(null);
  const [cells, setCells] = React.useState<CellContents[][]>(() => {
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
    return [
      {
        id: 1,
        name: 'Candidates',
        colorIndex: 0,
        visible: true,
        strokes: [],
        texts: [],
      },
    ];
  });

  type HistoryEntry = { cells: CellContents[][]; layers: NoteLayer[]; };
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);
  const [eraseMode, setEraseMode] = React.useState(false);
  const { candidates: recognitionCandidates, showCandidates } = useRecognitionToast();

  const pushHistory = React.useCallback(
    (snapshotCells: CellContents[][], snapshotLayers: NoteLayer[]) => {
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

  const clearCandidatesRegion = (row: number, col: number) => {
    const boardEl = document.getElementById('sudoku-board-root');
    if (!boardEl) {
      return;
    }
    const rect = boardEl.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }

    const cellWidth = rect.width / 9;
    const cellHeight = rect.height / 9;

    const minX = col * cellWidth;
    const maxX = (col + 1) * cellWidth;
    const minY = row * cellHeight;
    const maxY = (row + 1) * cellHeight;

    setLayers((prevLayers) =>
      prevLayers.map((layer) => {
        if (layer.name !== 'Candidates') {
          return layer;
        }
        const filteredStrokes = layer.strokes.filter((stroke) => {
          return !stroke.points.some((point) => {
            return (
              point.x >= minX &&
              point.x <= maxX &&
              point.y >= minY &&
              point.y <= maxY
            );
          });
        });
        const filteredTexts = layer.texts
          ? layer.texts.filter((t) => {
            return !(
              t.x >= minX &&
              t.x <= maxX &&
              t.y >= minY &&
              t.y <= maxY
            );
          })
          : layer.texts;

        if (filteredStrokes === layer.strokes && filteredTexts === layer.texts) {
          return layer;
        }
        return {
          ...layer,
          strokes: filteredStrokes,
          texts: filteredTexts,
        };
      }),
    );
  };

  const clearCandidateDigitFromPeers = (row: number, col: number, digit: number) => {
    if (digit < 1 || digit > 9) {
      return;
    }

    const boardEl = document.getElementById('sudoku-board-root');
    if (!boardEl) {
      return;
    }
    const rect = boardEl.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }

    const cellWidth = rect.width / 9;
    const cellHeight = rect.height / 9;

    setLayers((prevLayers) =>
      prevLayers.map((layer) => {
        if (layer.name !== 'Candidates' || !layer.texts) {
          return layer;
        }

        const filteredTexts = layer.texts.filter((t) => {
          const cellRow = Math.floor(t.y / cellHeight);
          const cellCol = Math.floor(t.x / cellWidth);

          const sameRow = cellRow === row;
          const sameCol = cellCol === col;
          const sameBox =
            Math.floor(cellRow / 3) === Math.floor(row / 3) &&
            Math.floor(cellCol / 3) === Math.floor(col / 3);

          const isPeer = sameRow || sameCol || sameBox;

          if (isPeer && t.text === String(digit)) {
            return false;
          }
          return true;
        });

        if (filteredTexts === layer.texts) {
          return layer;
        }

        return {
          ...layer,
          texts: filteredTexts,
        };
      }),
    );
  };

  const handleDrawCandidates = () => {
    const boardForCandidates = fillCandidates(
      cells.map((row) =>
        row.map((cell) => ({
          ...cell,
          candidates: undefined,
        })),
      ),
    );

    const boardEl = document.getElementById('sudoku-board-root');
    if (!boardEl) {
      return;
    }
    const rect = boardEl.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }

    const cellWidth = rect.width / 9;
    const cellHeight = rect.height / 9;
    const slotWidth = cellWidth / 3;
    const slotHeight = cellHeight / 3;

    const texts: NoteText[] = [];

    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        const cell = boardForCandidates[row]?.[col];
        if (!cell || !cell.candidates || cell.candidates.length === 0) {
          continue;
        }

        for (const cand of cell.candidates) {
          const idx = cand - 1;
          if (idx < 0 || idx > 8) {
            continue;
          }
          const gridX = idx % 3;
          const gridY = Math.floor(idx / 3);

          const baseX = col * cellWidth;
          const baseY = row * cellHeight;
          const x = baseX + (gridX + 0.5) * slotWidth;
          const y = baseY + (gridY + 0.5) * slotHeight;

          texts.push({ x, y, text: String(cand) });
        }
      }
    }

    if (texts.length === 0) {
      return;
    }

    pushHistory(cells, layers);

    setLayers((prevLayers) =>
      prevLayers.map((layer) => {
        if (layer.name !== 'Candidates') {
          return layer;
        }
        return {
          ...layer,
          strokes: [],
          texts,
        };
      }),
    );
  };

  const handleChangeCell = (row: number, col: number, contents: CellContents) => {
    const nextCells = cells.map((rowArr, rIndex) => {
      if (rIndex !== row) {
        return rowArr;
      }
      return rowArr.map((cell, cIndex) => {
        if (cIndex !== col) {
          return cell;
        }
        return contents;
      });
    });

    pushHistory(cells, layers);
    const validated = recomputeValidity(nextCells);
    setCells(validated);

    const allFilled = validated.every((rowArr) =>
      rowArr.every((cell) => cell.value !== undefined),
    );
    if (allFilled && isBoardValid(validated)) {
      victoryRef.current?.show();
    }

    if (contents.user && contents.value !== undefined) {
      clearCandidatesRegion(row, col);
      clearCandidateDigitFromPeers(row, col, contents.value);
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
  };

  const handleResetApp = useResetApp();

  return (
    <div className="min-h-screen flex items-start justify-center py-3 px-3">
      <div className="flex w-full max-w-3xl flex-col items-stretch gap-3">
        <main className="mt-0 flex flex-col items-center gap-2">
          <Controls
            ref={controlsRef}
            onNewPuzzle={handleNewPuzzle}
            eraseMode={eraseMode}
            onToggleEraseMode={() => {
              setEraseMode((prev) => !prev);
            }}
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
              onChangeCell={handleChangeCell}
              onRecognitionCandidates={(_row, _col, outcome) => {
                showCandidates(outcome);
              }}
            />
          </div>
          <DigitIndicatorRow digits={Array.from({ length: 9 }, (_, i) => {
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
          })} />
          <NotesLayers
            eraseMode={eraseMode}
            layers={layers}
            setLayers={(updater) => {
              setLayers((prev) => updater(prev));
            }}
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
