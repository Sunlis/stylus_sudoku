export const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert', 'evil', 'extreme'] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
  evil: 'Evil',
  extreme: 'Extreme',
};
