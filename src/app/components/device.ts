"use client";

/** Anonymous per-browser id for mastery tracking (no accounts). */
export function deviceId(): string {
  try {
    let id = localStorage.getItem("playbook:device");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("playbook:device", id); }
    return id;
  } catch {
    return "";
  }
}
