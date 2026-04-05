export enum Difficulty {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
  Expert = 'expert',
}

export const DIFFICULTIES = [
  Difficulty.Easy,
  Difficulty.Medium,
  Difficulty.Hard,
  Difficulty.Expert,
];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  [Difficulty.Easy]: 'Easy',
  [Difficulty.Medium]: 'Medium',
  [Difficulty.Hard]: 'Hard',
  [Difficulty.Expert]: 'Expert',
};
