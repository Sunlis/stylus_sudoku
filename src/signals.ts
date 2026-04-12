import { Difficulty } from "./types/difficulty";

export enum Signal {
  SHOW_SETTINGS,
  NEW_GAME,
}

export type SIGNALS = {
  [Signal.SHOW_SETTINGS]: [],
  [Signal.NEW_GAME]: [difficulty: Difficulty, killerMode: boolean],
};

type Listener<S extends Signal> = (...args: SIGNALS[S]) => void;

const subscribers: { [S in Signal]?: Listener<S>[] } = {};

export function broadcast<S extends Signal>(signal: S, ...args: SIGNALS[S]) {
  (subscribers[signal] ?? []).forEach((listener: Listener<S>) => {
    listener(...args);
  });
}

export function subscribe<S extends Signal>(signal: S, callback: Listener<S>) {
  if (!subscribers[signal]) {
    subscribers[signal] = [];
  }
  subscribers[signal]!.push(callback);
}
