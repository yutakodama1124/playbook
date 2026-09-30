/** Escape Room scoring. Fair by design: wrong answers never cost points, they only break the streak. */
export const HINT_COST = 25;
export const NO_HINT_BONUS = 50;

/** What a lock is worth right now, given how many of its hints were used. */
export function lockWorth(hintsUsed: number, isExit: boolean): number {
  const base = isExit ? 200 : 100;
  return Math.max(25, base - HINT_COST * hintsUsed) + (hintsUsed === 0 ? NO_HINT_BONUS : 0);
}

/** Extra points for solving locks in a row without a wrong answer. */
export function streakBonus(streak: number): number {
  return streak >= 2 ? Math.min(100, 25 * (streak - 1)) : 0;
}

export const fmtClock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
