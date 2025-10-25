import { useCallback, useSyncExternalStore } from "react";

export interface RoadmapItem {
  modelId: string;
  addedAt: number;
}

export interface Roadmap {
  id: string;
  title: string;
  createdAt: number;
  items: RoadmapItem[];
}

interface RoadmapState {
  roadmaps: Roadmap[];
}

const STORAGE_KEY = "threadflow_roadmaps_v1";

function uid(prefix = "rdm") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

let STORE: RoadmapState = (function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as RoadmapState;
  } catch {}
  return { roadmaps: [] };
})();

const subscribers = new Set<() => void>();
function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(STORE));
  } catch {}
}
function setStore(updater: (s: RoadmapState) => RoadmapState) {
  STORE = updater(STORE);
  persist();
  for (const s of Array.from(subscribers)) s();
}
function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

export function useRoadmaps() {
  const state = useSyncExternalStore(subscribe, () => STORE, () => STORE);

  const createRoadmap = useCallback((title?: string) => {
    const count = state.roadmaps.length + 1;
    const roadmap: Roadmap = {
      id: uid("roadmap"),
      title: (title || `Roadmap ${count}`).trim(),
      createdAt: Date.now(),
      items: [],
    };
    setStore((s) => ({ roadmaps: [...s.roadmaps, roadmap] }));
    return roadmap.id;
  }, [state.roadmaps.length]);

  const deleteRoadmap = useCallback((roadmapId: string) => {
    setStore((s) => ({ roadmaps: s.roadmaps.filter((r) => r.id !== roadmapId) }));
  }, []);

  const renameRoadmap = useCallback((roadmapId: string, title: string) => {
    setStore((s) => ({
      roadmaps: s.roadmaps.map((r) => (r.id === roadmapId ? { ...r, title: title.trim() } : r)),
    }));
  }, []);

  const addModelToRoadmap = useCallback((roadmapId: string, modelId: string) => {
    setStore((s) => ({
      roadmaps: s.roadmaps.map((r) =>
        r.id === roadmapId
          ? r.items.some((it) => it.modelId === modelId)
            ? r
            : { ...r, items: [...r.items, { modelId, addedAt: Date.now() }] }
          : r,
      ),
    }));
  }, []);

  const removeModelFromRoadmap = useCallback((roadmapId: string, modelId: string) => {
    setStore((s) => ({
      roadmaps: s.roadmaps.map((r) =>
        r.id === roadmapId ? { ...r, items: r.items.filter((it) => it.modelId !== modelId) } : r,
      ),
    }));
  }, []);

  return {
    roadmaps: state.roadmaps,
    createRoadmap,
    deleteRoadmap,
    renameRoadmap,
    addModelToRoadmap,
    removeModelFromRoadmap,
  };
}
