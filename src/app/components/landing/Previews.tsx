// Static previews built from the real game UI, so the landing page shows the product itself.
const ART = "https://zyxnnfgoyosgjngoapsw.supabase.co/storage/v1/object/public/assets/library";

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] ${className}`}>{children}</div>;
}

export function CasePreview() {
  return (
    <Frame className="p-4 text-[13px]">
      <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
        <img src={`${ART}/import-portrait-pharmacist-middle-aged.png`} alt="" className="h-9 w-9 rounded-md object-cover" />
        <div><p className="font-medium">Dana Reyes</p><p className="text-zinc-500">Pharmacist · suspect</p></div>
      </div>
      <div className="space-y-2 py-3">
        <div className="flex justify-end"><p className="max-w-[80%] rounded-lg bg-zinc-950 px-3 py-2 text-white">Why did the plants stop making ATP within minutes?</p></div>
        <p className="max-w-[85%] rounded-lg bg-zinc-100 px-3 py-2 text-zinc-800">I stock a lot of chemicals. Most of them act over hours, not minutes. Ask the lab about the tox report.</p>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2"><span className="truncate font-medium">Tox report</span><span className="shrink-0 text-zinc-400">Key evidence</span></div>
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
