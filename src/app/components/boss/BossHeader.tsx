import type { BossResponse } from "./useBoss";

export function BossHeader({ data }: { data: BossResponse }) {
  const { boss, art, unit } = data;
  const pct = boss.maxHp ? Math.round((boss.hp / boss.maxHp) * 100) : 0;
  const days = boss.daysLeft === null ? "No test date" : boss.daysLeft > 0 ? `Test in ${boss.daysLeft} day${boss.daysLeft === 1 ? "" : "s"}` : "Test day";
  return (
    <div className="flex gap-4">
      {art ? <img src={art} alt="" className="h-20 w-20 shrink-0 rounded-lg border border-zinc-200 object-cover" /> : <div className="h-20 w-20 shrink-0 rounded-lg bg-zinc-100" />}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-zinc-500">{days}</p>
        <p className="truncate font-semibold">{boss.defeated ? "Boss defeated" : `${unit.title} boss`}</p>
        <div className="mt-2 h-2 overflow-hidden rounded bg-zinc-100" role="progressbar" aria-valuenow={boss.hp} aria-valuemax={boss.maxHp} aria-label="Boss HP">
          <div className="h-full bg-zinc-950 transition-[width] duration-700" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-xs tabular-nums text-zinc-500">{boss.hp} / {boss.maxHp} HP</p>
      </div>
    </div>
  );
}
