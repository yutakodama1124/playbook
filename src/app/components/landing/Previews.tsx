// Static previews built from the real game UI, so the landing page shows the product itself.
const ART = "https://zyxnnfgoyosgjngoapsw.supabase.co/storage/v1/object/public/assets/library";

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] ${className}`}>{children}</div>;
}

export function CasePreview() {
  return (
    <Frame className="relative bg-zinc-950 p-4 text-[13px] text-white">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Testimony 2 of 3</p>
        <p className="text-red-500" aria-label="4 lives">{"\u2665".repeat(4)}<span className="text-white/20">{"\u2665"}</span></p>
      </div>
      <div className="mt-3 flex gap-3 rounded-xl border-2 border-white/15 bg-zinc-900 p-3">
        <img src={`${ART}/import-portrait-pharmacist-middle-aged.png`} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
        <div><p className="font-bold text-amber-300">Dana</p><p className="mt-0.5 text-[14px] leading-snug">&ldquo;The cells were fine. They just switched to fermenting.&rdquo;</p></div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <span className="rounded-lg bg-sky-500 py-2 text-center font-black uppercase">Press</span>
        <span className="rounded-lg bg-red-600 py-2 text-center font-black uppercase">Present</span>
      </div>
      <p className="absolute right-3 top-12 rotate-[-8deg] rounded-md border-4 border-red-500 bg-black/70 px-2 py-0.5 text-lg font-black uppercase text-red-500">Objection!</p>
    </Frame>
  );
}

export function EscapePreview() {
  const marks: [number, number, string, string][] = [[22, 30, "1", "Clue"], [52, 58, "2", "Locked"], [80, 40, "3", "Open"]];
  return (
    <Frame>
      <div className="relative">
        <img src={`${ART}/import-scene-chemistry-lab-night.png`} alt="" className="aspect-[16/10] w-full object-cover" />
        {marks.map(([x, y, n, s]) => (
          <span key={n} style={{ left: `${x}%`, top: `${y}%` }} className={`absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md text-xs font-semibold shadow-md ${s === "Open" ? "bg-accent text-white" : "bg-white text-zinc-900"}`}>{n}</span>
        ))}
      </div>
      <div className="divide-y divide-zinc-100 text-[13px]">
        {marks.map(([, , n, s], i) => (
          <div key={n} className="flex items-center gap-3 px-4 py-2">
            <span className="w-3 tabular-nums text-zinc-400">{n}</span>
            <span className="flex-1 font-medium">{["Lab notebook", "Oxygen sensor safe", "Fume hood panel"][i]}</span>
            <span className={s === "Open" ? "text-accent" : s === "Locked" ? "text-zinc-900" : "text-zinc-400"}>{s}</span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

export function ImpostorPreview() {
  return (
    <Frame className="mx-auto max-w-[260px] p-4 text-[13px]">
      <p className="text-center text-zinc-500">The Calvin cycle</p>
      <div className="mt-3 rounded-lg bg-zinc-950 p-4 text-white">
        <p className="text-red-400">You&apos;re the impostor. This fact is fake.</p>
        <p className="mt-2 text-[15px] font-medium leading-snug">Each turn of the Calvin cycle releases one molecule of glucose.</p>
      </div>
      <p className="mt-4 font-medium">Who has the fake?</p>
      <div className="mt-2 space-y-1.5">
        {["Aki", "Ben", "Cho"].map((n, i) => <div key={n} className={`rounded-md border px-3 py-2 ${i === 1 ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200"}`}>{n}</div>)}
      </div>
    </Frame>
  );
}
