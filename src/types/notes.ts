export type Point = {
  x: number;
  y: number;
};

export type Stroke = {
  points: Point[];
  erase?: boolean;
};

export type NoteText = {
  x: number;
  y: number;
  text: string;
};

export type NoteLayer = {
  id: number;
  name: string;
  colorIndex: number;
  visible: boolean;
  strokes: Stroke[];
  texts?: NoteText[];
};
