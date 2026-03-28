import { Difficulty } from "./types";
import type { CellContents } from "./board";
import type { Trace } from "./handwriting";

interface UserPreferences {
  difficulty: Difficulty;
  recognitionDelay: number;
  boardState?: CellContents[][];
  notesLayers?: unknown;
  handwritingStrokes?: Record<string, Trace>;
}

const defaultPreferences: UserPreferences = {
  difficulty: 'medium',
  recognitionDelay: 1000,
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
        console.error('Error parsing user preferences from localStorage', e);
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

  getRecognitionDelay(): number {
    return this.preferences.recognitionDelay;
  }

  setRecognitionDelay(delay: number) {
    this.preferences.recognitionDelay = delay;
    this.setPreferences();
  }

  getBoardState(): CellContents[][] | null {
    return this.preferences.boardState ?? null;
  }

  setBoardState(cells: CellContents[][]): void {
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
}

export const userStorage = new UserStorage();
