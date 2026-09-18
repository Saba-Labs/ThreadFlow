import { useCallback, useSyncExternalStore } from "react";
import { useSSESubscription } from "@/hooks/useSSESubscription";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

export interface RoadmapItem {
  modelId: string;
  modelName: string;
  quantity: number;
  photoUrl?: string;
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

function notifySubscribers() {
  for (const subscriber of Array.from(subscribers)) subscriber();
}

async function fetchRoadmaps() {
  if (isLoading) return;
  isLoading = true;
  try {
    STORE = await fetchWithTimeout<Roadmap[]>("/api/roadmaps");
    notifySubscribers();
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
  const refreshRoadmaps = useCallback(() => fetchRoadmaps(), []);

  useSSESubscription((event) => {
    if (event.type === "roadmaps_updated") {
      fetchRoadmaps();
    }
  });

  const createRoadmap = useCallback(async (title?: string) => {
    try {
      const count = STORE.length + 1;
      const roadmapId = uid("roadmap");
      await fetchWithTimeout("/api/roadmaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: roadmapId,
          title: (title || `Roadmap ${count}`).trim(),
        }),
      });

      await fetchRoadmaps();
      return roadmapId;
    } catch (error) {
      console.error("Error creating roadmap:", error);
      throw error;
    }
  }, []);

  const deleteRoadmap = useCallback(async (roadmapId: string) => {
    try {
      await fetchWithTimeout(`/api/roadmaps/${roadmapId}`, {
        method: "DELETE",
      });
      await fetchRoadmaps();
    } catch (error) {
      console.error("Error deleting roadmap:", error);
      throw error;
    }
  }, []);

  const renameRoadmap = useCallback(
    async (roadmapId: string, title: string) => {
      try {
        await fetchWithTimeout(`/api/roadmaps/${roadmapId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.trim() }),
        });
        await fetchRoadmaps();
      } catch (error) {
        console.error("Error renaming roadmap:", error);
        throw error;
      }
    },
    [],
  );

  const reorderRoadmaps = useCallback(async (roadmapIds: string[]) => {
    const previousStore = STORE;
    const roadmapById = new Map(STORE.map((roadmap) => [roadmap.id, roadmap]));
    STORE = roadmapIds
      .map((roadmapId) => roadmapById.get(roadmapId))
      .filter((roadmap): roadmap is Roadmap => Boolean(roadmap));
    notifySubscribers();

    try {
      await fetchWithTimeout("/api/roadmaps/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roadmapIds }),
      });
      await fetchRoadmaps();
    } catch (error) {
      STORE = previousStore;
      notifySubscribers();
      console.error("Error reordering roadmaps:", error);
      throw error;
    }
  }, []);

  const addModelToRoadmap = useCallback(
    async (
      roadmapId: string,
      modelId: string,
      modelName: string,
      quantity: number,
      photoUrl?: string,
    ) => {
      try {
        console.log("[useRoadmaps.addModelToRoadmap] Called with:", {
          roadmapId,
          modelId,
          modelName,
          quantity,
        });

        await fetchWithTimeout(`/api/roadmaps/${roadmapId}/models`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelId,
            modelName,
            quantity,
            photoUrl,
          }),
        });

        console.log("[useRoadmaps.addModelToRoadmap] Success");

        await fetchRoadmaps();
      } catch (error) {
        console.error("Error adding model to roadmap:", error);
        throw error;
      }
    },
    [],
  );

  const updateModelPhoto = useCallback(
    async (roadmapId: string, modelId: string, photoUrl: string | null) => {
      const previousStore = STORE;
      STORE = STORE.map((roadmap) =>
        roadmap.id === roadmapId
          ? {
              ...roadmap,
              items: roadmap.items.map((item) =>
                item.modelId === modelId
                  ? { ...item, photoUrl: photoUrl || undefined }
                  : item,
              ),
            }
          : roadmap,
      );
      notifySubscribers();

      try {
        await fetchWithTimeout(
          `/api/roadmaps/${roadmapId}/models/${modelId}/photo`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photoUrl }),
          },
        );
      } catch (error) {
        STORE = previousStore;
        notifySubscribers();
        console.error("Error updating roadmap model photo:", error);
        throw error;
      }
    },
    [],
  );

  const removeModelFromRoadmap = useCallback(
    async (roadmapId: string, modelId: string) => {
      try {
        await fetchWithTimeout(`/api/roadmaps/${roadmapId}/models/${modelId}`, {
          method: "DELETE",
        });
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
      const previousStore = STORE;
      const roadmap = STORE.find((r) => r.id === roadmapId);
      if (!roadmap) return;

      const currentIndex = roadmap.items.findIndex(
        (item) => item.modelId === modelId,
      );
      if (currentIndex === -1) return;

      const newItems = roadmap.items.slice();
      const [item] = newItems.splice(currentIndex, 1);
      const dest = Math.max(0, Math.min(toIndex, newItems.length));
      newItems.splice(dest, 0, item);
      STORE = STORE.map((currentRoadmap) =>
        currentRoadmap.id === roadmapId
          ? { ...currentRoadmap, items: newItems }
          : currentRoadmap,
      );
      notifySubscribers();

      try {
        await fetchWithTimeout(`/api/roadmaps/${roadmapId}/reorder`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: newItems.map((roadmapItem) => roadmapItem.modelId),
          }),
        });
        await fetchRoadmaps();
      } catch (error) {
        STORE = previousStore;
        notifySubscribers();
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
      const previousStore = STORE;
      const sourceRoadmap = STORE.find(
        (roadmap) => roadmap.id === fromRoadmapId,
      );
      const destinationRoadmap = STORE.find(
        (roadmap) => roadmap.id === toRoadmapId,
      );
      const item = sourceRoadmap?.items.find(
        (roadmapItem) => roadmapItem.modelId === modelId,
      );
      if (!sourceRoadmap || !destinationRoadmap || !item) return;

      const destinationHasItem = destinationRoadmap.items.some(
        (roadmapItem) => roadmapItem.modelId === modelId,
      );
      const sourceItems = sourceRoadmap.items.filter(
        (roadmapItem) => roadmapItem.modelId !== modelId,
      );
      const destinationItems = destinationRoadmap.items.slice();
      if (!destinationHasItem) {
        const destinationIndex =
          typeof toIndex === "number"
            ? Math.max(0, Math.min(toIndex, destinationItems.length))
            : destinationItems.length;
        destinationItems.splice(destinationIndex, 0, item);
      }

      STORE = STORE.map((roadmap) => {
        if (roadmap.id === fromRoadmapId)
          return { ...roadmap, items: sourceItems };
        if (roadmap.id === toRoadmapId) {
          return { ...roadmap, items: destinationItems };
        }
        return roadmap;
      });
      notifySubscribers();

      try {
        await fetchWithTimeout("/api/roadmaps/move-model", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromRoadmapId,
            toRoadmapId,
            modelId,
            ...(typeof toIndex === "number" ? { toIndex } : {}),
          }),
        });
        await fetchRoadmaps();
      } catch (error) {
        STORE = previousStore;
        notifySubscribers();
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
    reorderRoadmaps,
    addModelToRoadmap,
    updateModelPhoto,
    removeModelFromRoadmap,
    moveModelWithinRoadmap,
    moveModelToRoadmap,
    refreshRoadmaps,
  };
}
