import * as React from "react";

export interface JobWork {
  id: string;
  name: string;
  description: string;
}

const STORAGE_KEY = "threadflow_job_works_v1";

let STORE: JobWork[] = (function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as JobWork[];
  } catch {}
  return [];
})();

const subscribers = new Set<() => void>();
function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(STORE));
  } catch {}
}

export function getJobWorks() {
  return STORE;
}

export function setJobWorks(list: JobWork[]) {
  STORE = list.slice();
  persist();
  for (const s of Array.from(subscribers)) s();
}

export function addJobWork(input: { name: string; description: string }) {
  const jw: JobWork = {
    id: `jw_${Math.random().toString(36).slice(2, 9)}`,
    name: input.name.trim(),
    description: input.description.trim(),
  };
  setJobWorks([jw, ...STORE]);
  return jw.id;
}

export function updateJobWork(id: string, patch: Partial<JobWork>) {
  setJobWorks(STORE.map((j) => (j.id === id ? { ...j, ...patch } : j)));
}

export function deleteJobWork(id: string) {
  setJobWorks(STORE.filter((j) => j.id !== id));
}

export function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

export function useJobWorks() {
  return useSyncExternalStore(subscribe, getJobWorks, getJobWorks);
}
