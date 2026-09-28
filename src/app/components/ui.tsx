import Link from "next/link";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
const VARIANT: Record<Variant, string> = {
  primary: "bg-zinc-950 text-white hover:bg-zinc-800",
  secondary: "border border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50",
  ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
  danger: "bg-red-700 text-white hover:bg-red-800",
};
const SIZE = { sm: "h-8 px-3 text-sm", md: "h-10 px-4 text-sm", lg: "h-12 px-5 text-base" };

export function buttonClass(variant: Variant = "primary", size: keyof typeof SIZE = "md", extra = "") {
  return `inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 ${VARIANT[variant]} ${SIZE[size]} ${extra}`;
}

export function Button({ variant = "primary", size = "md", className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: keyof typeof SIZE }) {
  return <button className={buttonClass(variant, size, className)} {...rest} />;
}

export function Card({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-xl border border-zinc-200 bg-white ${className}`} {...rest} />;
}

/** Small secondary label above a value or section. Sentence case, not an all-caps eyebrow. */
export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-[13px] font-medium text-zinc-500 ${className}`}>{children}</p>;
}

export const inputClass = "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/5";

export function Spinner({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 ${className}`} />;
}

export function PageHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-[15px] font-semibold tracking-tight text-zinc-950">Playbook</Link>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </header>
  );
}
