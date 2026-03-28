import { Difficulty } from "./types";
import type { CellContents } from "./board";

interface UserPreferences {
  difficulty: Difficulty;
  recognitionDelay: number;
  boardState?: CellContents[][];
  notesLayers?: unknown;
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
}

export const userStorage = new UserStorage();
