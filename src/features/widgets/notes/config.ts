export interface NotesConfig {
  defaultColorIndex: number;
}

export const defaultNotesConfig: NotesConfig = {
  defaultColorIndex: 0,
};

/** 5 sticky-note color themes — keeps the spirit of the original dashboard. */
export const NOTE_THEMES = [
  { bg: "oklch(0.22 0.04 80)", border: "oklch(0.30 0.06 80)", text: "oklch(0.85 0.12 80)", dot: "oklch(0.40 0.10 80)" },
  { bg: "oklch(0.20 0.04 240)", border: "oklch(0.28 0.06 240)", text: "oklch(0.82 0.12 240)", dot: "oklch(0.38 0.10 240)" },
  { bg: "oklch(0.21 0.05 305)", border: "oklch(0.29 0.07 305)", text: "oklch(0.82 0.14 305)", dot: "oklch(0.38 0.12 305)" },
  { bg: "oklch(0.20 0.04 155)", border: "oklch(0.28 0.06 155)", text: "oklch(0.82 0.12 155)", dot: "oklch(0.38 0.10 155)" },
  { bg: "oklch(0.22 0.05 30)", border: "oklch(0.30 0.07 30)", text: "oklch(0.84 0.14 30)", dot: "oklch(0.40 0.12 30)" },
] as const;
