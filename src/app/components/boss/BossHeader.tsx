import type { BossResponse } from "./useBoss";

export function BossHeader({ data }: { data: BossResponse }) {
  const { boss, art, unit } = data;
  const pct = boss.maxHp ? Math.round((boss.hp / boss.maxHp) * 100) : 0;
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-stone-900 p-4 text-white">
      {art ? <img src={art} alt="" className="h-24 w-24 rounded-xl object-cover" /> : <div className="h-24 w-24 rounded-xl bg-stone-700" />}
      <div className="flex-1 space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-lg font-bold">{boss.defeated ? `${unit.title} Boss — defeated` : `${unit.title} Boss`}</p>
          <p className="text-sm text-stone-300">{boss.daysLeft === null ? "No test date set" : boss.daysLeft > 0 ? `Test in ${boss.daysLeft} day${boss.daysLeft === 1 ? "" : "s"}` : "Test day"}</p>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-stone-700" role="progressbar" aria-valuenow={boss.hp} aria-valuemax={boss.maxHp} aria-label="Boss HP">
          <div className="h-full rounded-full bg-rose-500 transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-stone-400">{boss.hp} / {boss.maxHp} HP{boss.shields.length ? ` · ${boss.shields.length} shield${boss.shields.length === 1 ? "" : "s"} up` : ""}</p>
      </div>
    </div>
  );
}
