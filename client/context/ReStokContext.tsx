import { useCallback, useSyncExternalStore } from "react";
import { useSSESubscription } from "@/hooks/useSSESubscription";
import { toast } from "@/hooks/use-toast";

export interface SubItem {
  id: string;
  name: string;
  quantity: number;
  lowStock: number;
}

export interface Item {
  id: string;
  name: string;
  quantity: number;
  lowStock: number;
  note?: string;
  subItems: SubItem[];
}

let STORE: Item[] = [];
let isLoading = false;
let isInitialized = false;
let lastFetchError: Error | null = null;

const subscribers = new Set<() => void>();
const loadingSubscribers = new Set<() => void>();

async function fetchItems() {
  if (isLoading) return;
  isLoading = true;
  for (const s of Array.from(loadingSubscribers)) s();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch("/api/restok/items", {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch items`);
    }

    const data = await response.json();
    const validatedData = data.map((item: Item) => ({
      ...item,
      subItems: item.subItems.map((sub: SubItem) => ({
        ...sub,
        lowStock: typeof sub.lowStock === "number" ? sub.lowStock : 0,
      })),
    }));
    STORE = validatedData;
    isInitialized = true;
    lastFetchError = null;
    for (const s of Array.from(subscribers)) s();
  } catch (error) {
    lastFetchError = error instanceof Error ? error : new Error(String(error));
    console.error("Error fetching restok items:", lastFetchError);
    // If initial load failed and we have no data, keep trying to initialize
    if (!isInitialized) {
      console.warn("Initial load failed, will retry on next interaction");
    }
  } finally {
    isLoading = false;
    for (const s of Array.from(loadingSubscribers)) s();
  }
}

function getItems() {
  return STORE;
}

function getIsLoading() {
  return isLoading;
}

function subscribeToLoading(cb: () => void) {
  loadingSubscribers.add(cb);
  return () => loadingSubscribers.delete(cb);
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  if (!isInitialized && !isLoading) {
    // If initialization failed, try again
    if (lastFetchError) {
      console.log("Retrying initial fetch after previous error");
    }
    fetchItems();
  }
  return () => subscribers.delete(cb);
}

async function apiCall<T>(
  method: string,
  url: string,
  body?: any,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const options: RequestInit = {
      method,
      signal: controller.signal,
    };

    if (body) {
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Network error: Unable to reach the server. Please check your connection.",
      );
    }
    throw error;
  }
}

export function useReStok() {
  const state = useSyncExternalStore(subscribe, getItems, getItems);
  const loading = useSyncExternalStore(
    subscribeToLoading,
    getIsLoading,
    () => false,
  );

  useSSESubscription((event) => {
    if (event.type === "restok_updated") {
      fetchItems();
    }
  });

  const addItem = useCallback(
    async (
      name: string,
      lowStock: number,
      subItems: any[] = [],
      note: string = "",
    ) => {
      try {
        const id = Date.now().toString();
        await apiCall("/api/restok/items", "POST", {
          id,
          name,
          quantity: 0,
          lowStock,
          note,
          subItems: subItems.map((sub) => ({
            id: sub.id,
            name: sub.name,
            quantity: 0,
            lowStock: sub.lowStock,
          })),
        });
        await fetchItems();
        toast({
          title: "Success",
          description: "Item added successfully",
        });
      } catch (error) {
        console.error("Failed to create item:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to add item",
          variant: "destructive",
        });
        throw error;
      }
    },
    [],
  );

  const deleteItem = useCallback(async (itemId: string) => {
    try {
      await apiCall(`/api/restok/items/${itemId}`, "DELETE");
      await fetchItems();
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete item:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete item",
        variant: "destructive",
      });
      throw error;
    }
  }, []);

  const updateItemQuantity = useCallback(
    async (itemId: string, newQuantity: number) => {
      const item = STORE.find((i) => i.id === itemId);
      if (!item) return;

      const updatedQuantity = Math.max(0, newQuantity);
      try {
        const response = await fetch(`/api/restok/items/${itemId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: item.name,
            quantity: updatedQuantity,
            lowStock: item.lowStock,
            note: item.note,
            subItems: item.subItems,
          }),
        });
        if (!response.ok) throw new Error("Failed to update item");
        await fetchItems();
      } catch (error) {
        console.error("Failed to update item quantity:", error);
        throw error;
      }
    },
    [],
  );

  const saveEditItemDetails = useCallback(
    async (itemId: string, name: string, lowStock: number, note: string) => {
      const item = STORE.find((i) => i.id === itemId);
      if (!item) return;

      try {
        const response = await fetch(`/api/restok/items/${itemId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            quantity: item.quantity,
            lowStock,
            note,
            subItems: item.subItems,
          }),
        });
        if (!response.ok) throw new Error("Failed to update item");
        await fetchItems();
        toast({
          title: "Success",
          description: "Item saved successfully",
        });
      } catch (error) {
        console.error("Failed to update item details:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to save item",
          variant: "destructive",
        });
        throw error;
      }
    },
    [],
  );

  const addSubItem = useCallback(
    async (parentItemId: string, name: string, lowStock: number) => {
      const item = STORE.find((i) => i.id === parentItemId);
      if (!item) {
        console.error("Item not found:", parentItemId);
        throw new Error("Item not found");
      }

      const newSubItem: SubItem = {
        id: Date.now().toString(),
        name,
        quantity: 0,
        lowStock,
      };

      const payload = {
        name: item.name,
        quantity: item.quantity,
        lowStock: item.lowStock,
        note: item.note,
        subItems: [
          ...item.subItems.map((s) => ({
            id: s.id,
            name: s.name,
            quantity: s.quantity,
            lowStock: s.lowStock ?? 0,
          })),
          newSubItem,
        ],
      };

      try {
        const response = await fetch(`/api/restok/items/${parentItemId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Failed to add sub-item");
        await fetchItems();
        toast({
          title: "Success",
          description: "Sub-item added successfully",
        });
      } catch (error) {
        console.error("Failed to add sub-item:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to add sub-item",
          variant: "destructive",
        });
        throw error;
      }
    },
    [],
  );

  const deleteSubItem = useCallback(
    async (parentItemId: string, subItemId: string) => {
      const item = STORE.find((i) => i.id === parentItemId);
      if (!item) return;

      try {
        const response = await fetch(`/api/restok/items/${parentItemId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: item.name,
            quantity: item.quantity,
            lowStock: item.lowStock,
            note: item.note,
            subItems: item.subItems
              .filter((s) => s.id !== subItemId)
              .map((s) => ({
                id: s.id,
                name: s.name,
                quantity: s.quantity,
                lowStock: s.lowStock ?? 0,
              })),
          }),
        });
        if (!response.ok) throw new Error("Failed to delete sub-item");
        await fetchItems();
        toast({
          title: "Success",
          description: "Sub-item deleted successfully",
        });
      } catch (error) {
        console.error("Failed to delete sub-item:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to delete sub-item",
          variant: "destructive",
        });
        throw error;
      }
    },
    [],
  );

  const updateSubItemQuantity = useCallback(
    async (parentItemId: string, subItemId: string, newQuantity: number) => {
      const item = STORE.find((i) => i.id === parentItemId);
      if (!item) return;

      const updatedQuantity = Math.max(0, newQuantity);
      try {
        const response = await fetch(`/api/restok/items/${parentItemId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: item.name,
            quantity: item.quantity,
            lowStock: item.lowStock,
            note: item.note,
            subItems: item.subItems.map((s) =>
              s.id === subItemId
                ? {
                    id: s.id,
                    name: s.name,
                    quantity: updatedQuantity,
                    lowStock: s.lowStock ?? 0,
                  }
                : {
                    id: s.id,
                    name: s.name,
                    quantity: s.quantity,
                    lowStock: s.lowStock ?? 0,
                  },
            ),
          }),
        });
        if (!response.ok) throw new Error("Failed to update sub-item");
        await fetchItems();
      } catch (error) {
        console.error("Failed to update sub-item quantity:", error);
        throw error;
      }
    },
    [],
  );

  const updateSubItem = useCallback(
    async (
      parentItemId: string,
      subItemId: string,
      name: string,
      lowStock: number,
    ) => {
      const item = STORE.find((i) => i.id === parentItemId);
      if (!item) return;

      const payload = {
        name: item.name,
        quantity: item.quantity,
        lowStock: item.lowStock,
        note: item.note,
        subItems: item.subItems.map((s) =>
          s.id === subItemId
            ? {
                id: s.id,
                name,
                quantity: s.quantity,
                lowStock: typeof lowStock === "number" ? lowStock : 0,
              }
            : {
                id: s.id,
                name: s.name,
                quantity: s.quantity,
                lowStock: s.lowStock ?? 0,
              },
        ),
      };

      try {
        const response = await fetch(`/api/restok/items/${parentItemId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Failed to update sub-item");
        await fetchItems();
        toast({
          title: "Success",
          description: "Sub-item updated successfully",
        });
      } catch (error) {
        console.error("Failed to update sub-item:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to update sub-item",
          variant: "destructive",
        });
        throw error;
      }
    },
    [],
  );

  const reorderItems = useCallback(async (itemIds: string[]) => {
    try {
      const response = await fetch("/api/restok/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds }),
      });
      if (!response.ok) throw new Error("Failed to save new order");
      await fetchItems();
      toast({
        title: "Success",
        description: "Items reordered successfully",
      });
    } catch (error) {
      console.error("Failed to save reorder:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to reorder items",
        variant: "destructive",
      });
      throw error;
    }
  }, []);

  return {
    items: state,
    loading,
    addItem,
    deleteItem,
    updateItemQuantity,
    saveEditItemDetails,
    addSubItem,
    deleteSubItem,
    updateSubItemQuantity,
    updateSubItem,
    reorderItems,
  };
}
