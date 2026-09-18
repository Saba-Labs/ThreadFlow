import { useCallback, useSyncExternalStore } from "react";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { useSSESubscription } from "@/hooks/useSSESubscription";

export interface LibraryImage {
  id: string;
  name: string;
  imageData: string;
  createdAt: number;
}

let STORE: LibraryImage[] = [];
let isLoading = false;
const subscribers = new Set<() => void>();

function notifySubscribers() {
  for (const subscriber of Array.from(subscribers)) subscriber();
}

async function fetchImages() {
  if (isLoading) return;
  isLoading = true;
  try {
    STORE = await fetchWithTimeout<LibraryImage[]>("/api/library/images");
    notifySubscribers();
  } catch (error) {
    console.error("Error fetching library images:", error);
  } finally {
    isLoading = false;
  }
}

function subscribe(callback: () => void) {
  subscribers.add(callback);
  if (STORE.length === 0) void fetchImages();
  return () => subscribers.delete(callback);
}

export function useImageLibrary() {
  const images = useSyncExternalStore(
    subscribe,
    () => STORE,
    () => STORE,
  );

  useSSESubscription((event) => {
    if (event.type === "library_updated") void fetchImages();
  });

  const addImage = useCallback(async (name: string, imageData: string) => {
    await fetchWithTimeout("/api/library/images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, imageData }),
    });
    await fetchImages();
  }, []);

  const renameImage = useCallback(async (id: string, name: string) => {
    await fetchWithTimeout(`/api/library/images/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    await fetchImages();
  }, []);

  const deleteImage = useCallback(async (id: string) => {
    await fetchWithTimeout(`/api/library/images/${id}`, { method: "DELETE" });
    await fetchImages();
  }, []);

  return {
    images,
    addImage,
    renameImage,
    deleteImage,
    refreshImages: fetchImages,
  };
}
