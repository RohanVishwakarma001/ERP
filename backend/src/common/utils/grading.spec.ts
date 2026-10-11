import { computeSgpa, gradeFor } from './grading';

describe('grading', () => {
  it.each([
    [95, 'O', 10],
    [90, 'O', 10],
    [89.9, 'A+', 9],
    [72, 'A', 8],
    [45, 'C', 5],
    [40, 'P', 4],
    [39.9, 'F', 0],
    [0, 'F', 0],
  ])('%d%% → %s (%d)', (percent, grade, gp) => {
    expect(gradeFor(percent)).toMatchObject({ grade, gradePoint: gp });
  });

  it('computes credit-weighted SGPA', () => {
    // (4·9 + 4·10 + 3·8 + 2·10) / 13 = 120 / 13 = 9.23
    expect(
      computeSgpa([
        { credits: 4, gradePoint: 9 },
        { credits: 4, gradePoint: 10 },
        { credits: 3, gradePoint: 8 },
        { credits: 2, gradePoint: 10 },
      ]),
    ).toBe(9.23);
  });

  it('returns null rather than a fake value when there are no credits', () => {
    expect(computeSgpa([])).toBeNull();
  });
});
