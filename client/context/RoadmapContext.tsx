import { useCallback, useState, useEffect, useRef } from "react";

export interface RoadmapItem {
  modelId: string;
  modelName: string;
  quantity: number;
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
  loading: boolean;
  error: string | null;
}

function uid(prefix = "rdm") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

let globalState: RoadmapState = {
  roadmaps: [],
  loading: true,
  error: null,
};

const subscribers = new Set<() => void>();
let pollInterval: NodeJS.Timeout | null = null;

function notifySubscribers() {
  for (const s of Array.from(subscribers)) s();
}

async function fetchRoadmaps() {
  try {
    globalState.loading = true;
    globalState.error = null;
    const response = await fetch("/api/roadmaps");
    if (!response.ok) throw new Error("Failed to fetch roadmaps");
    globalState.roadmaps = await response.json();
  } catch (error) {
    globalState.error = String(error);
    console.error("Error fetching roadmaps:", error);
  } finally {
    globalState.loading = false;
    notifySubscribers();
  }
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

function startPolling() {
  if (pollInterval) return;
  fetchRoadmaps();
  pollInterval = setInterval(() => {
    fetchRoadmaps();
  }, 5000);
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

export function useRoadmaps() {
  const [state, setState] = useState<RoadmapState>(globalState);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      startPolling();
    }

    setState(globalState);
    const unsub = subscribe(() => {
      setState({ ...globalState });
    });

    return unsub;
  }, []);

  const createRoadmap = useCallback(
    async (title?: string) => {
      try {
        const count = globalState.roadmaps.length + 1;
        const roadmapId = uid("roadmap");
        const response = await fetch("/api/roadmaps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: roadmapId,
            title: (title || `Roadmap ${count}`).trim(),
          }),
        });

        if (!response.ok) throw new Error("Failed to create roadmap");
        await fetchRoadmaps();
        return roadmapId;
      } catch (error) {
        console.error("Error creating roadmap:", error);
        throw error;
      }
    },
    []
  );

  const deleteRoadmap = useCallback(async (roadmapId: string) => {
    try {
      const response = await fetch(`/api/roadmaps/${roadmapId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete roadmap");
      await fetchRoadmaps();
    } catch (error) {
      console.error("Error deleting roadmap:", error);
      throw error;
    }
  }, []);

  const renameRoadmap = useCallback(async (roadmapId: string, title: string) => {
    try {
      const response = await fetch(`/api/roadmaps/${roadmapId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (!response.ok) throw new Error("Failed to update roadmap");
      await fetchRoadmaps();
    } catch (error) {
      console.error("Error renaming roadmap:", error);
      throw error;
    }
  }, []);

  const addModelToRoadmap = useCallback(
    async (
      roadmapId: string,
      modelId: string,
      modelName: string,
      quantity: number
    ) => {
      try {
        const response = await fetch(`/api/roadmaps/${roadmapId}/models`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelId,
            modelName,
            quantity,
          }),
        });
        if (!response.ok) throw new Error("Failed to add model to roadmap");
        await fetchRoadmaps();
      } catch (error) {
        console.error("Error adding model to roadmap:", error);
        throw error;
      }
    },
    []
  );

  const removeModelFromRoadmap = useCallback(
    async (roadmapId: string, modelId: string) => {
      try {
        const response = await fetch(
          `/api/roadmaps/${roadmapId}/models/${modelId}`,
          {
            method: "DELETE",
          }
        );
        if (!response.ok) throw new Error("Failed to remove model from roadmap");
        await fetchRoadmaps();
      } catch (error) {
        console.error("Error removing model from roadmap:", error);
        throw error;
      }
    },
    []
  );

  const moveModelWithinRoadmap = useCallback(
    async (roadmapId: string, modelId: string, toIndex: number) => {
      try {
        const roadmap = globalState.roadmaps.find((r) => r.id === roadmapId);
        if (!roadmap) return;

        const items = roadmap.items;
        const currentIndex = items.findIndex((it) => it.modelId === modelId);
        if (currentIndex === -1) return;

        const newItems = items.slice();
        const [item] = newItems.splice(currentIndex, 1);
        const dest = Math.max(0, Math.min(toIndex, newItems.length));
        newItems.splice(dest, 0, item);

        const modelIds = newItems.map((it) => it.modelId);
        const response = await fetch(`/api/roadmaps/${roadmapId}/reorder`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: modelIds }),
        });

        if (!response.ok) throw new Error("Failed to reorder items");
        await fetchRoadmaps();
      } catch (error) {
        console.error("Error moving model within roadmap:", error);
        throw error;
      }
    },
    []
  );

  const moveModelToRoadmap = useCallback(
    async (
      fromRoadmapId: string,
      toRoadmapId: string,
      modelId: string,
      toIndex?: number
    ) => {
      try {
        const response = await fetch("/api/roadmaps/move-model", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromRoadmapId,
            toRoadmapId,
            modelId,
          }),
        });
        if (!response.ok) throw new Error("Failed to move model between roadmaps");
        await fetchRoadmaps();
      } catch (error) {
        console.error("Error moving model to roadmap:", error);
        throw error;
      }
    },
    []
  );

  return {
    roadmaps: state.roadmaps,
    loading: state.loading,
    error: state.error,
    createRoadmap,
    deleteRoadmap,
    renameRoadmap,
    addModelToRoadmap,
    removeModelFromRoadmap,
    moveModelWithinRoadmap,
    moveModelToRoadmap,
  };
}
