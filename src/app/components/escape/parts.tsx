"use client";
import { useEffect, useEffectEvent, useRef, type ReactNode } from "react";
import { Typewriter } from "../game/Juice";

/* ---------- Icons (inline, stroke-based, inherit currentColor) ---------- */
const svg = "h-5 w-5 fill-none stroke-current";
export const LockIcon = ({ open = false, className = svg }: { open?: boolean; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    {open ? <path d="M8 11V7a4 4 0 0 1 7.8-1.2" /> : <path d="M8 11V7a4 4 0 0 1 8 0v4" />}
  </svg>
);
export const SearchIcon = ({ className = svg }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} strokeWidth={2} strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="6" /><path d="m20 20-4.5-4.5" /></svg>
);
export const CheckIcon = ({ className = svg }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m5 12 5 5 9-10" /></svg>
);
export const DoorIcon = ({ className = svg }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M3 21h18" /><circle cx="14.5" cy="12" r=".8" fill="currentColor" /></svg>
);
export const BookIcon = ({ className = svg }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z" /><path d="M4 21a2 2 0 0 1 2-2h13v2" /></svg>
);
export const ShardIcon = ({ className = svg }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} strokeWidth={2} strokeLinejoin="round" aria-hidden><path d="m12 2 7 7-7 13L5 9l7-7Z" /><path d="M5 9h14" /></svg>
);

/**
 * Modal shell: bottom sheet on phones, centered panel on larger screens.
 * Focus moves in on open, Tab is trapped, Escape closes, focus returns on close.
 */
export function Sheet({ label, onClose, children, panelClass = "", dismissable = true, z = "z-30" }: {
  label: string; onClose: () => void; children: ReactNode; panelClass?: string; dismissable?: boolean; z?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useEffectEvent(() => { if (dismissable) onClose(); });
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab" || !ref.current) return;
      const els = [...ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), select, input, summary, [href], [tabindex]:not([tabindex="-1"])')];
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, []);

  return (
    <div className={`fixed inset-0 ${z} flex items-end justify-center bg-black/60 backdrop-blur-[2px] sm:items-center sm:p-6`} onMouseDown={(e) => { if (e.target === e.currentTarget && dismissable) onClose(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}
        className={`pb-rise max-h-[88dvh] w-full overflow-y-auto rounded-t-2xl shadow-2xl outline-none sm:max-w-lg sm:rounded-2xl ${panelClass}`}>
        {children}
      </div>
    </div>
  );
}

/** In-world note: reading a clue object or a collected fragment. */
export function NotePopup({ kicker, title, text, onClose, typewriter = true }: { kicker: string; title: string; text: string; onClose: () => void; typewriter?: boolean }) {
  return (
    <Sheet label={title} onClose={onClose} panelClass="bg-[#efe6cf] text-zinc-900">
      <div className="px-6 pb-6 pt-5">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-900/15 sm:hidden" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{kicker}</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight">{title}</h2>
        <div className="mt-4 border-t border-dashed border-zinc-900/20 pt-4 font-mono text-[15px] leading-relaxed">
          {typewriter ? <><p aria-hidden className="min-h-[4lh] whitespace-pre-line"><Typewriter key={text} text={text} speed={12} /></p><p className="sr-only whitespace-pre-line">{text}</p></> : <p className="whitespace-pre-line">{text}</p>}
        </div>
        <button onClick={onClose} className="mt-6 h-12 w-full rounded-xl bg-zinc-900 font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/30">Got it</button>
      </div>
    </Sheet>
  );
}
