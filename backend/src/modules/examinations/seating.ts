/**
 * Anti-cheating seat allocation: candidates are interleaved round-robin across
 * groups (e.g. departments) so that, wherever possible, neighbours in seat order
 * belong to different groups. Largest groups are drawn from first so they don't
 * pile up at the end of the hall.
 */
export function interleaveByGroup<T>(items: T[], groupOf: (item: T) => string): T[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = groupOf(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  const queues = [...groups.values()].sort((a, b) => b.length - a.length);
  const result: T[] = [];
  while (queues.some((q) => q.length > 0)) {
    for (const q of queues) {
      const next = q.shift();
      if (next !== undefined) result.push(next);
    }
  }
  return result;
}

export interface SeatPosition {
  seatNumber: string;
  deskRow: number;
  deskCol: number;
}

/** Row-major desk positions: row A..Z, column 1..n → "A1", "A2", … */
export function seatPositions(count: number, columns: number): SeatPosition[] {
  return Array.from({ length: count }, (_, i) => {
    const deskRow = Math.floor(i / columns) + 1;
    const deskCol = (i % columns) + 1;
    return { seatNumber: `${String.fromCharCode(64 + deskRow)}${deskCol}`, deskRow, deskCol };
  });
}
