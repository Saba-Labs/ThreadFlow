import { useCallback, useSyncExternalStore } from "react";
import { useSSESubscription } from "@/hooks/useSSESubscription";

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

function uid(prefix = "rdm") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

let STORE: Roadmap[] = [];
let isLoading = false;

const subscribers = new Set<() => void>();

async function fetchRoadmaps() {
  if (isLoading) return;
  isLoading = true;
  try {
    const response = await fetch("/api/roadmaps");
    if (!response.ok) throw new Error("Failed to fetch roadmaps");
    STORE = await response.json();
    for (const s of Array.from(subscribers)) s();
  } catch (error) {
    console.error("Error fetching roadmaps:", error);
  } finally {
    isLoading = false;
  }
}

function getRoadmaps() {
  return STORE;
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  if (STORE.length === 0) {
    fetchRoadmaps();
  }
  return () => subscribers.delete(cb);
}

export function useRoadmaps() {
  const state = useSyncExternalStore(subscribe, getRoadmaps, getRoadmaps);

  useSSESubscription((event) => {
    if (event.type === "roadmaps_updated") {
      fetchRoadmaps();
    }
  });

  const createRoadmap = useCallback(async (title?: string) => {
    try {
      const count = STORE.length + 1;
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
  }, []);

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

  const renameRoadmap = useCallback(
    async (roadmapId: string, title: string) => {
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
    },
    [],
  );

  const addModelToRoadmap = useCallback(
    async (
      roadmapId: string,
      modelId: string,
      modelName: string,
      quantity: number,
    ) => {
      try {
        console.log("[useRoadmaps.addModelToRoadmap] Called with:", {
          roadmapId,
          modelId,
          modelName,
          quantity,
        });

        const response = await fetch(`/api/roadmaps/${roadmapId}/models`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelId,
            modelName,
            quantity,
          }),
        });

        console.log("[useRoadmaps.addModelToRoadmap] Response status:", {
          status: response.status,
          ok: response.ok,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(
            "[useRoadmaps.addModelToRoadmap] Error response:",
            errorData,
          );
          throw new Error(
            errorData.error || `Failed to add model to roadmap (${response.status})`,
          );
        }

        await fetchRoadmaps();
      } catch (error) {
        console.error("Error adding model to roadmap:", error);
        throw error;
      }
    },
    [],
  );

  const removeModelFromRoadmap = useCallback(
    async (roadmapId: string, modelId: string) => {
      try {
        const response = await fetch(
          `/api/roadmaps/${roadmapId}/models/${modelId}`,
          {
            method: "DELETE",
          },
        );
        if (!response.ok)
          throw new Error("Failed to remove model from roadmap");
        await fetchRoadmaps();
      } catch (error) {
        console.error("Error removing model from roadmap:", error);
        throw error;
      }
    },
    [],
  );

  const moveModelWithinRoadmap = useCallback(
    async (roadmapId: string, modelId: string, toIndex: number) => {
      try {
        const roadmap = STORE.find((r) => r.id === roadmapId);
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
    [],
  );

  const moveModelToRoadmap = useCallback(
    async (
      fromRoadmapId: string,
      toRoadmapId: string,
      modelId: string,
      toIndex?: number,
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
        if (!response.ok)
          throw new Error("Failed to move model between roadmaps");
        await fetchRoadmaps();
      } catch (error) {
        console.error("Error moving model to roadmap:", error);
        throw error;
      }
    },
    [],
  );

  return {
    roadmaps: state,
    createRoadmap,
    deleteRoadmap,
    renameRoadmap,
    addModelToRoadmap,
    removeModelFromRoadmap,
    moveModelWithinRoadmap,
    moveModelToRoadmap,
  };
}
