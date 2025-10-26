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
  const state = React.useSyncExternalStore(
    subscribe,
    () => STORE,
    () => STORE,
  );

  const createRoadmap = React.useCallback(
    (title?: string) => {
      const count = state.roadmaps.length + 1;
      const roadmap: Roadmap = {
        id: uid("roadmap"),
        title: (title || `Roadmap ${count}`).trim(),
        createdAt: Date.now(),
        items: [],
      };
      setStore((s) => ({ roadmaps: [...s.roadmaps, roadmap] }));
      return roadmap.id;
    },
    [state.roadmaps.length],
  );

  const deleteRoadmap = React.useCallback((roadmapId: string) => {
    setStore((s) => ({
      roadmaps: s.roadmaps.filter((r) => r.id !== roadmapId),
    }));
  }, []);

  const renameRoadmap = React.useCallback((roadmapId: string, title: string) => {
    setStore((s) => ({
      roadmaps: s.roadmaps.map((r) =>
        r.id === roadmapId ? { ...r, title: title.trim() } : r,
      ),
    }));
  }, []);

  const addModelToRoadmap = React.useCallback(
    (roadmapId: string, modelId: string) => {
      setStore((s) => ({
        roadmaps: s.roadmaps.map((r) =>
          r.id === roadmapId
            ? r.items.some((it) => it.modelId === modelId)
              ? r
              : { ...r, items: [...r.items, { modelId, addedAt: Date.now() }] }
            : r,
        ),
      }));
    },
    [],
  );

  const removeModelFromRoadmap = React.useCallback(
    (roadmapId: string, modelId: string) => {
      setStore((s) => ({
        roadmaps: s.roadmaps.map((r) =>
          r.id === roadmapId
            ? { ...r, items: r.items.filter((it) => it.modelId !== modelId) }
            : r,
        ),
      }));
    },
    [],
  );

  const moveModelWithinRoadmap = React.useCallback(
    (roadmapId: string, modelId: string, toIndex: number) => {
      setStore((s) => ({
        roadmaps: s.roadmaps.map((r) => {
          if (r.id !== roadmapId) return r;
          const idx = r.items.findIndex((it) => it.modelId === modelId);
          if (idx === -1) return r;
          const items = r.items.slice();
          const [item] = items.splice(idx, 1);
          const dest = Math.max(0, Math.min(toIndex, items.length));
          items.splice(dest, 0, item);
          return { ...r, items };
        }),
      }));
    },
    [],
  );

  const moveModelToRoadmap = React.useCallback(
    (
      fromRoadmapId: string,
      toRoadmapId: string,
      modelId: string,
      toIndex?: number,
    ) => {
      setStore((s) => {
        const from = s.roadmaps.find((r) => r.id === fromRoadmapId);
        const to = s.roadmaps.find((r) => r.id === toRoadmapId);
        if (!from || !to) return s;
        const exists = to.items.some((it) => it.modelId === modelId);
        // remove from source
        const newRoadmaps = s.roadmaps.map((r) =>
          r.id === fromRoadmapId
            ? { ...r, items: r.items.filter((it) => it.modelId !== modelId) }
            : r,
        );
        if (exists) return { roadmaps: newRoadmaps };
        // insert into dest
        const destIndex =
          typeof toIndex === "number"
            ? Math.max(0, Math.min(toIndex, to.items.length))
            : to.items.length;
        return {
          roadmaps: newRoadmaps.map((r) =>
            r.id === toRoadmapId
              ? {
                  ...r,
                  items: [
                    ...r.items.slice(0, destIndex),
                    { modelId, addedAt: Date.now() },
                    ...r.items.slice(destIndex),
                  ],
                }
              : r,
          ),
        };
      });
    },
    [],
  );

  return {
    roadmaps: state.roadmaps,
    createRoadmap,
    deleteRoadmap,
    renameRoadmap,
    addModelToRoadmap,
    removeModelFromRoadmap,
    moveModelWithinRoadmap,
    moveModelToRoadmap,
  };
}
