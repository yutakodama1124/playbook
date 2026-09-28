"use client";

export type RecentUnit = { id: string; title: string; course: string };
const KEY = "playbook:units";

export function loadRecent(): RecentUnit[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
export function rememberUnit(u: RecentUnit) {
  try { localStorage.setItem(KEY, JSON.stringify([u, ...loadRecent().filter((x) => x.id !== u.id)].slice(0, 12))); } catch { /* storage blocked */ }
}
