import { useSyncExternalStore } from "react";

const STORAGE_KEY = "stitchflow_machine_types_v2";
const LEGACY_STORAGE_KEY = "stitchflow_machine_types_v1";

export interface MachineTypeConfig {
  name: string;
  letter: string;
}

export const DEFAULT_MACHINE_TYPES: MachineTypeConfig[] = [
  { name: "Singer", letter: "S" },
  { name: "Folding", letter: "F" },
  { name: "Roll", letter: "R" },
  { name: "Fleet", letter: "Fl" },
  { name: "Overlock 3T", letter: "O" },
  { name: "Elastic", letter: "E" },
  { name: "5 Thread Joint", letter: "5" },
  { name: "Kaja", letter: "K" },
  { name: "Button", letter: "B" },
  { name: "Ring Button", letter: "RB" },
  { name: "Trimming", letter: "T" },
  { name: "Ironing", letter: "I" },
  { name: "Packing", letter: "P" },
  { name: "Job Work", letter: "J" },
];

function migrateFromLegacy(legacy: string[]): MachineTypeConfig[] {
  return legacy.map((name) => ({
    name,
    letter: name.charAt(0).toUpperCase(),
  }));
}

let STORE: MachineTypeConfig[] = (function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MachineTypeConfig[];
  } catch {}
  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as string[];
      return migrateFromLegacy(parsed);
    }
  } catch {}
  return DEFAULT_MACHINE_TYPES.slice();
})();

const subscribers = new Set<() => void>();

export function getMachineTypes() {
  return STORE;
}

export function setMachineTypes(list: MachineTypeConfig[]) {
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
