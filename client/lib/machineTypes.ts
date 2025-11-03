import { useSyncExternalStore } from "react";
import { useSSESubscription } from "@/hooks/useSSESubscription";
import { fetchWithTimeout } from "./fetchWithTimeout";

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

let STORE: MachineTypeConfig[] = DEFAULT_MACHINE_TYPES.slice();
let isLoading = false;
let initialized = false;

const subscribers = new Set<() => void>();

async function fetchFromServer() {
  if (isLoading) return;
  isLoading = true;
  try {
    const data = await fetchWithTimeout<MachineTypeConfig[]>(
      "/api/machine-types",
    );
    if (data.length > 0) {
      STORE = data;
    } else {
      await saveToServer(DEFAULT_MACHINE_TYPES);
      STORE = DEFAULT_MACHINE_TYPES.slice();
    }
    for (const s of Array.from(subscribers)) s();
  } catch (error) {
    console.error("Failed to fetch machine types:", error);
  } finally {
    isLoading = false;
  }
}

async function saveToServer(types: MachineTypeConfig[]) {
  try {
    await fetchWithTimeout("/api/machine-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(types),
    });
  } catch (error) {
    console.error("Failed to save machine types:", error);
    throw error;
  }
}

export function getMachineTypes() {
  return STORE;
}

export async function setMachineTypes(list: MachineTypeConfig[]) {
  STORE = list.slice();
  await saveToServer(STORE);
  for (const s of Array.from(subscribers)) s();
}

export function subscribe(cb: () => void) {
  subscribers.add(cb);
  if (!initialized) {
    initialized = true;
    fetchFromServer();
  }
  return () => subscribers.delete(cb);
}

export function getMachineTypeConfig(
  name: string,
): MachineTypeConfig | undefined {
  return getMachineTypes().find((m) => m.name === name);
}

// React hook for components
export function useMachineTypes() {
  const state = useSyncExternalStore(
    subscribe,
    getMachineTypes,
    getMachineTypes,
  );

  useSSESubscription((event) => {
    if (event.type === "machine_types_updated") {
      fetchFromServer();
    }
  });

  return state;
}
