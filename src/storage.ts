import { Difficulty } from "./types/difficulty";
import type { Board } from "@app/types/board";
import type { Trace } from "./handwriting";
import { broadcast, Signal } from "./signals";
import { Color } from "./colour";

export interface Theme {
  fixedCellBackground: Color;
  userCellBackground: Color;
  fixedHighlightBackground: Color;
  userHighlightBackground: Color;
  invalidCellBackground: Color;
  cellTextColor: Color;
  candidateTextColor: Color;
}

interface UserPreferences {
  difficulty: Difficulty;
  recognitionDelay: number;
  killerMode: boolean;
  boardState?: Board;
  notesLayers?: unknown;
  handwritingStrokes?: Record<string, Trace>;
  theme: Theme;
}

const defaultPreferences: UserPreferences = {
  difficulty: Difficulty.Medium,
  recognitionDelay: 1000,
  killerMode: false,
  theme: {
    fixedCellBackground: { r: 33, g: 21, b: 4, a: 0.2 },
    userCellBackground: { r: 72, g: 150, b: 134, a: 0.3 },
    fixedHighlightBackground: { r: 248, g: 224, b: 129, a: 0.7 },
    userHighlightBackground: { r: 191, g: 77, b: 252, a: 0.75 },
    invalidCellBackground: { r: 255, g: 100, b: 100, a: 0.5 },
    cellTextColor: { r: 0, g: 0, b: 0, a: 0.8 },
    candidateTextColor: { r: 0, g: 0, b: 0, a: 0.4 },
  },
};

class UserStorage {
  preferences: UserPreferences;

  constructor() {
    this.preferences = this.getPreferences();
  }

  private getPreferences(): UserPreferences {
    const prefsStr = localStorage.getItem('userPreferences');
    if (prefsStr) {
      try {
        const prefs = JSON.parse(prefsStr);
        return {
          ...defaultPreferences,
          ...prefs,
        };
      } catch (e) {
        console.warn('Error parsing user preferences from localStorage', e);
      }
    }
    return defaultPreferences;
  }

  private setPreferences() {
    localStorage.setItem('userPreferences', JSON.stringify(this.preferences));
  }

  getDifficulty(): Difficulty {
    return this.preferences.difficulty;
  }

  setDifficulty(difficulty: Difficulty) {
    this.preferences.difficulty = difficulty;
    this.setPreferences();
  }

  getKillerMode(): boolean {
    return this.preferences.killerMode;
  }

  setKillerMode(killerMode: boolean) {
    this.preferences.killerMode = killerMode;
    this.setPreferences();
  }

  getRecognitionDelay(): number {
    return this.preferences.recognitionDelay;
  }

  setRecognitionDelay(delay: number) {
    this.preferences.recognitionDelay = delay;
    this.setPreferences();
  }

  getBoardState(): Board | null {
    const state = this.preferences.boardState;
    if (!state || !Array.isArray((state as any).grid)) {
      return null;
    }
    return state;
  }

  setBoardState(cells: Board): void {
    this.preferences.boardState = cells;
    this.setPreferences();
  }

  getNotesLayers<T = unknown>(): T | null {
    return (this.preferences.notesLayers as T | undefined) ?? null;
  }

  setNotesLayers(layers: unknown): void {
    this.preferences.notesLayers = layers;
    this.setPreferences();
  }

  getHandwritingTrace(key: string): Trace | null {
    const store = this.preferences.handwritingStrokes;
    if (!store) {
      return null;
    }
    return store[key] ?? null;
  }

  setHandwritingTrace(key: string, trace: Trace | null): void {
    if (!this.preferences.handwritingStrokes) {
      this.preferences.handwritingStrokes = {};
    }
    if (trace && trace.length > 0) {
      this.preferences.handwritingStrokes[key] = trace;
    } else {
      delete this.preferences.handwritingStrokes[key];
    }
    this.setPreferences();
  }

  getTheme(): Theme {
    return {
      ...defaultPreferences.theme,
      ...this.preferences.theme,
    };
  }

  setTheme(theme: Theme): void {
    this.preferences.theme = theme;
    this.setPreferences();
    broadcast(Signal.UPDATE_THEME, theme);
  }

  updateTheme(partial: Partial<Theme>): void {
    this.setTheme({
      ...this.getTheme(),
      ...partial,
    });
  }
}

export const userStorage = new UserStorage();
