import { useSyncExternalStore } from "react";
import { useSSESubscription } from "@/hooks/useSSESubscription";
import { fetchWithTimeout } from "./fetchWithTimeout";

export interface JobWork {
  id: string;
  name: string;
  description: string;
}

let STORE: JobWork[] = [];
let isLoading = false;

const subscribers = new Set<() => void>();

async function fetchFromServer() {
  if (isLoading) return;
  isLoading = true;
  try {
    STORE = await fetchWithTimeout<JobWork[]>("/api/jobworks");
    for (const s of Array.from(subscribers)) s();
  } catch (error) {
    console.error("Failed to fetch job works:", error);
  } finally {
    isLoading = false;
  }
}

export function getJobWorks() {
  return STORE;
}

export function setJobWorks(list: JobWork[]) {
  STORE = list.slice();
  for (const s of Array.from(subscribers)) s();
}

export async function addJobWork(input: { name: string; description: string }) {
  const id = `jw_${Math.random().toString(36).slice(2, 9)}`;
  try {
    const response = await fetch("/api/jobworks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        name: input.name.trim(),
        description: input.description.trim(),
      }),
    });
    if (!response.ok) throw new Error("Failed to create job work");
    await fetchFromServer();
    return id;
  } catch (error) {
    console.error("Failed to add job work:", error);
    throw error;
  }
}

export async function updateJobWork(id: string, patch: Partial<JobWork>) {
  try {
    const existing = STORE.find((j) => j.id === id);
    if (!existing) throw new Error("Job work not found");
    const updated = { ...existing, ...patch };
    const response = await fetch(`/api/jobworks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (!response.ok) throw new Error("Failed to update job work");
    await fetchFromServer();
  } catch (error) {
    console.error("Failed to update job work:", error);
    throw error;
  }
}

export async function deleteJobWork(id: string) {
  try {
    const response = await fetch(`/api/jobworks/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete job work");
    await fetchFromServer();
  } catch (error) {
    console.error("Failed to delete job work:", error);
    throw error;
  }
}

export function subscribe(cb: () => void) {
  subscribers.add(cb);
  if (STORE.length === 0) {
    fetchFromServer();
  }
  return () => subscribers.delete(cb);
}

export function useJobWorks() {
  const state = useSyncExternalStore(subscribe, getJobWorks, getJobWorks);

  useSSESubscription((event) => {
    if (event.type === "jobworks_updated") {
      fetchFromServer();
    }
  });

  return state;
}
