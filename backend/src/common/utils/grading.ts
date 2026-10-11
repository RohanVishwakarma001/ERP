/**
 * UTU 10-point relative grading scale. Grade cards, SGPA and the seating/marks
 * modules all use these helpers so the scale is defined once.
 */
export interface GradeBand {
  minPercent: number;
  grade: string;
  gradePoint: number;
}

export const GRADE_BANDS: readonly GradeBand[] = [
  { minPercent: 90, grade: 'O', gradePoint: 10 },
  { minPercent: 80, grade: 'A+', gradePoint: 9 },
  { minPercent: 70, grade: 'A', gradePoint: 8 },
  { minPercent: 60, grade: 'B+', gradePoint: 7 },
  { minPercent: 50, grade: 'B', gradePoint: 6 },
  { minPercent: 45, grade: 'C', gradePoint: 5 },
  { minPercent: 40, grade: 'P', gradePoint: 4 },
  { minPercent: 0, grade: 'F', gradePoint: 0 },
];

export const PASSING_GRADE_POINT = 4;

export function gradeFor(percent: number): GradeBand {
  return GRADE_BANDS.find((band) => percent >= band.minPercent) ?? GRADE_BANDS[GRADE_BANDS.length - 1];
}

/** Credit-weighted grade point average, rounded to two decimals. null when no credits. */
export function computeSgpa(courses: { credits: number; gradePoint: number }[]): number | null {
  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
  if (totalCredits === 0) return null;
  const weighted = courses.reduce((sum, c) => sum + c.credits * c.gradePoint, 0);
  return Math.round((weighted / totalCredits) * 100) / 100;
}
