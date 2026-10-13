export type Progress = {
  notes: string;
  completions: number;
  tries: number | null;
  repeat: boolean;
  submitted: boolean;
  retained: boolean;
};

export const blankProgress: Progress = {
  notes: '', completions: 0, tries: null,
  repeat: false, submitted: false, retained: false,
};

// Older attempts may have a completion count without the newer submitted flag.
export function isCompleted(progress: Progress) {
  return progress.submitted || progress.completions > 0;
}
