import { useSyncExternalStore } from "react";

const STORAGE_KEY = "stitchflow_machine_types_v1";

export const DEFAULT_MACHINE_TYPES = [
  "Singer",
  "Folding",
  "Roll",
  "Fleet",
  "Overlock 3T",
  "Elastic",
  "5 Thread Joint",
  "Kaja",
  "Button",
  "Ring Button",
  "Trimming",
  "Ironing",
  "Packing",
  "Job Work",
];

let STORE: string[] = (function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch {}
  return DEFAULT_MACHINE_TYPES.slice();
})();

const subscribers = new Set<() => void>();

export function getMachineTypes() {
  return STORE.slice();
}

export function setMachineTypes(list: string[]) {
  STORE = list.slice();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(STORE));
  } catch {}
  for (const s of Array.from(subscribers)) s();
}

export function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

// React hook for components
export function useMachineTypes() {
  return useSyncExternalStore(subscribe, getMachineTypes, getMachineTypes);
}
